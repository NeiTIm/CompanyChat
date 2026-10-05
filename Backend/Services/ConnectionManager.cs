using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace CompanyChat.Api.Services;

public class ConnectionManager
{
    /*
     * UserId -> nhiều WebSocket connection
     *
     * Ví dụ:
     *
     * User 6
     * ├── Chrome
     * ├── Edge
     * └── Mobile
     */
    private readonly ConcurrentDictionary<
        int,
        ConcurrentDictionary<WebSocket, byte>
    > _connections = new();


    /*
     * UserId -> ConversationId đang mở
     */
    private readonly ConcurrentDictionary<int, int>
        _activeConversations = new();


    /* =====================================================
       ADD CONNECTION
    ===================================================== */

    public bool Add(
        int userId,
        WebSocket socket)
    {
        var sockets =
            _connections.GetOrAdd(
                userId,
                _ => new ConcurrentDictionary<
                    WebSocket,
                    byte>());


        /*
         * Nếu trước đó không có socket
         * thì user đang Offline.
         *
         * Đây là connection đầu tiên.
         */
        var wasOffline =
            sockets.IsEmpty;


        sockets.TryAdd(
            socket,
            0);


        return wasOffline;
    }


    /* =====================================================
       REMOVE CONNECTION
    ===================================================== */

    public bool Remove(
        int userId,
        WebSocket socket)
    {
        if (!_connections.TryGetValue(
                userId,
                out var sockets))
        {
            return false;
        }


        /*
         * Chỉ remove đúng socket này.
         */
        sockets.TryRemove(
            socket,
            out _);


        /*
         * Vẫn còn browser/device khác.
         *
         * User vẫn ONLINE.
         */
        if (!sockets.IsEmpty)
        {
            return false;
        }


        /*
         * Không còn connection nào.
         *
         * Chỉ remove user nếu dictionary
         * hiện tại vẫn chính là dictionary
         * mà chúng ta vừa kiểm tra.
         */
        var removed =
            ((ICollection<
                KeyValuePair<
                    int,
                    ConcurrentDictionary<WebSocket, byte>>>)
                _connections)
            .Remove(
                new KeyValuePair<
                    int,
                    ConcurrentDictionary<WebSocket, byte>>(
                    userId,
                    sockets));


        if (!removed)
        {
            /*
             * Một connection mới có thể
             * vừa được Add vào cùng lúc.
             *
             * User vẫn ONLINE.
             */
            return false;
        }


        /*
         * User thực sự OFFLINE.
         */
        _activeConversations.TryRemove(
            userId,
            out _);


        return true;
    }


    /* =====================================================
       IS ONLINE
    ===================================================== */

    public bool IsOnline(
        int userId)
    {
        return
            _connections.TryGetValue(
                userId,
                out var sockets)
            &&
            !sockets.IsEmpty;
    }


    /* =====================================================
       GET ONLINE USERS
    ===================================================== */

    public List<int> GetOnlineUserIds()
    {
        return _connections
            .Where(
                x => !x.Value.IsEmpty)
            .Select(
                x => x.Key)
            .ToList();
    }


    /* =====================================================
       ACTIVE CONVERSATION
    ===================================================== */

    public void SetActiveConversation(
        int userId,
        int conversationId)
    {
        _activeConversations[userId] =
            conversationId;
    }


    public void ClearActiveConversation(
        int userId)
    {
        _activeConversations.TryRemove(
            userId,
            out _);
    }


    public int? GetActiveConversation(
        int userId)
    {
        if (_activeConversations.TryGetValue(
                userId,
                out var conversationId))
        {
            return conversationId;
        }


        return null;
    }


    public bool IsUserViewingConversation(
        int userId,
        int conversationId)
    {
        return
            _activeConversations.TryGetValue(
                userId,
                out var activeConversationId)
            &&
            activeConversationId ==
                conversationId;
    }


    /* =====================================================
       SEND TO ONE SOCKET
    ===================================================== */

    public async Task<bool> SendToSocketAsync(
        WebSocket socket,
        string json,
        CancellationToken cancellationToken = default)
    {
        if (socket.State != WebSocketState.Open)
        {
            return false;
        }


        var bytes =
            Encoding.UTF8.GetBytes(json);


        try
        {
            await socket.SendAsync(
                bytes,
                WebSocketMessageType.Text,
                true,
                cancellationToken);


            return true;
        }
        catch
        {
            return false;
        }
    }


    /* =====================================================
       SEND TO USER
    ===================================================== */

    public async Task<bool> SendToUserAsync(
        int userId,
        string json,
        CancellationToken cancellationToken = default)
    {
        if (!_connections.TryGetValue(
                userId,
                out var sockets))
        {
            return false;
        }


        var delivered = false;


        /*
         * Copy socket list.
         *
         * Tránh collection bị thay đổi
         * trong lúc đang foreach.
         */
        var socketList =
            sockets.Keys.ToList();


        foreach (var socket in socketList)
        {
            if (socket.State !=
                WebSocketState.Open)
            {
                sockets.TryRemove(
                    socket,
                    out _);

                continue;
            }


            var success =
                await SendToSocketAsync(
                    socket,
                    json,
                    cancellationToken);


            if (success)
            {
                delivered = true;
            }
            else
            {
                sockets.TryRemove(
                    socket,
                    out _);
            }
        }


        /*
         * Không còn socket.
         */
        if (sockets.IsEmpty)
        {
            var removed =
                ((ICollection<
                    KeyValuePair<
                        int,
                        ConcurrentDictionary<WebSocket, byte>>>)
                    _connections)
                .Remove(
                    new KeyValuePair<
                        int,
                        ConcurrentDictionary<WebSocket, byte>>(
                        userId,
                        sockets));


            if (removed)
            {
                _activeConversations.TryRemove(
                    userId,
                    out _);
            }
        }


        return delivered;
    }


    /* =====================================================
       DISCONNECT USER

       Dùng khi Admin:
       - Khóa tài khoản
       - Xóa tài khoản

       Sẽ:
       1. Gửi account_disabled cho toàn bộ socket.
       2. Đóng toàn bộ WebSocket.

       QUAN TRỌNG:
       Không remove user khỏi _connections ngay tại đây.

       ChatWebSocketHandler.finally sẽ gọi Remove()
       sau khi socket đóng.

       Nhờ vậy logic:
       - IsOnline
       - LastSeen
       - user_status
       vẫn được xử lý đúng.
       
       Hỗ trợ:
       - Chrome
       - Edge
       - Mobile
       - Nhiều tab
       ===================================================== */

    public async Task<bool> DisconnectUserAsync(
        int userId,
        string reason =
            "Your account is no longer active.",
        string reasonCode = "locked")
    {
        if (!_connections.TryGetValue(
                userId,
                out var sockets))
        {
            /*
             * Không có WebSocket đang hoạt động.
             */
            _activeConversations.TryRemove(
                userId,
                out _);

            return false;
        }


        /*
         * =================================================
           TẠO EVENT GỬI CHO FRONTEND
         * =================================================
         *
         * locked:
         * {
         *   "type": "account_disabled",
         *   "reason": "locked",
         *   "message": "..."
         * }
         *
         * deleted:
         * {
         *   "type": "account_disabled",
         *   "reason": "deleted",
         *   "message": "..."
         * }
         */
        var accountDisabledJson =
            JsonSerializer.Serialize(
                new
                {
                    type = "account_disabled",
                    reason = reasonCode,
                    message = reason
                });


        /*
         * Copy danh sách socket.
         *
         * Không foreach trực tiếp trên dictionary
         * vì socket có thể bị remove đồng thời.
         */
        var socketList =
            sockets.Keys.ToList();


        /*
         * =================================================
           GỬI THÔNG BÁO TRƯỚC KHI ĐÓNG SOCKET
         * =================================================
         */
        foreach (var socket in socketList)
        {
            if (socket.State !=
                WebSocketState.Open)
            {
                continue;
            }


            await SendToSocketAsync(
                socket,
                accountDisabledJson);
        }


        /*
         * =================================================
           ĐÓNG TOÀN BỘ WEBSOCKET
         * =================================================
         */
        foreach (var socket in socketList)
        {
            try
            {
                /*
                 * Chỉ đóng socket đang
                 * còn có thể đóng.
                 */
                if (socket.State ==
                        WebSocketState.Open ||
                    socket.State ==
                        WebSocketState.CloseReceived)
                {
                    await socket.CloseAsync(
                        WebSocketCloseStatus.PolicyViolation,
                        reason,
                        CancellationToken.None);
                }
            }
            catch
            {
                /*
                 * Socket có thể đã
                 * disconnect trước đó.
                 *
                 * Không để một socket lỗi
                 * làm ảnh hưởng các socket khác.
                 */
            }
        }


        return true;
    }


    /* =====================================================
       BROADCAST
    ===================================================== */

    public async Task BroadcastAsync(
        string json,
        CancellationToken cancellationToken = default)
    {
        var userIds =
            _connections.Keys.ToList();


        foreach (var userId in userIds)
        {
            await SendToUserAsync(
                userId,
                json,
                cancellationToken);
        }
    }
}