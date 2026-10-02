using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;

namespace CompanyChat.Api.Services;

public class ConnectionManager
{
    private readonly ConcurrentDictionary<int, WebSocket> _connections = new();

    /*
     * UserId -> ConversationId đang mở
     *
     * Ví dụ:
     * User 2 đang mở conversation 7
     *
     * 2 -> 7
     */
    private readonly ConcurrentDictionary<int, int> _activeConversations = new();

    public void Add(int userId, WebSocket socket)
    {
        _connections.AddOrUpdate(
            userId,
            socket,
            (_, oldSocket) =>
            {
                try
                {
                    oldSocket.Abort();
                }
                catch
                {
                }

                return socket;
            });
    }

    public bool Remove(int userId, WebSocket socket)
    {
        if (_connections.TryGetValue(userId, out var current) &&
            ReferenceEquals(current, socket))
        {
            _activeConversations.TryRemove(
                userId,
                out _);

            return _connections.TryRemove(
                userId,
                out _);
        }

        return false;
    }

    public bool IsOnline(int userId)
    {
        return _connections.ContainsKey(userId);
    }

    /*
     * ============================================
     * ACTIVE CONVERSATION
     * ============================================
     */

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
        return _activeConversations.TryGetValue(
                   userId,
                   out var activeConversationId)
               &&
               activeConversationId ==
               conversationId;
    }

    public async Task<bool> SendToUserAsync(
        int userId,
        string json,
        CancellationToken cancellationToken = default)
    {
        if (!_connections.TryGetValue(
                userId,
                out var socket))
        {
            return false;
        }

        if (socket.State != WebSocketState.Open)
        {
            _connections.TryRemove(
                userId,
                out _);

            _activeConversations.TryRemove(
                userId,
                out _);

            return false;
        }

        try
        {
            var bytes =
                Encoding.UTF8.GetBytes(json);

            await socket.SendAsync(
                bytes,
                WebSocketMessageType.Text,
                true,
                cancellationToken);

            return true;
        }
        catch
        {
            _connections.TryRemove(
                userId,
                out _);

            _activeConversations.TryRemove(
                userId,
                out _);

            return false;
        }
    }

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