using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;

namespace CompanyChat.Api.Services;

public class ConnectionManager
{
    private readonly ConcurrentDictionary<int, WebSocket> _connections = new();

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