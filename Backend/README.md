# CompanyChat - ASP.NET Core Web API

Backend for an internal company chat.

## Stack

- ASP.NET Core Web API .NET 9
- SQL Server
- Entity Framework Core
- JWT Authentication
- Role Authorization
- Native WebSocket
- BCrypt password hashing
- Swagger

## Default users

| Username | Password | Role |
|---|---|---|
| admin | Admin@123 | Admin |
| tien | 123456 | Employee |
| an | 123456 | Employee |
| linh | 123456 | Employee |

Change these credentials before using the project outside development.

## 1. Create the database

Open terminal in this folder:

```powershell
dotnet restore
dotnet tool install --global dotnet-ef
dotnet ef migrations add InitialCreate
dotnet ef database update
```

If `dotnet-ef` is already installed, skip the install command.

## 2. Run

```powershell
dotnet run --urls "http://localhost:5000"
```

Swagger:

```text
http://localhost:5000/swagger
```

## 3. Login

POST:

```text
/api/auth/login
```

Body:

```json
{
  "username": "tien",
  "password": "123456"
}
```

Copy the JWT from the response and click `Authorize` in Swagger.

## 4. WebSocket

After login, connect:

```text
ws://localhost:5000/ws/chat?access_token=YOUR_JWT
```

Send:

```json
{
  "type": "message",
  "conversationId": 1,
  "receiverId": 3,
  "content": "Xin chào An!"
}
```

The server checks that both sender and receiver belong to the conversation before saving and delivering the message.

## Important

The WebSocket endpoint accepts the JWT through the `access_token` query parameter because the browser's native WebSocket API does not provide a normal Authorization-header API during the handshake.

For production, use HTTPS/WSS, a strong secret stored outside source control, proper refresh-token handling, rate limiting, message validation, and a distributed connection/backplane strategy when running multiple API instances.
