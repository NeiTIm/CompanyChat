# CompanyChat React Frontend

## Requirements

- Node.js 20+ recommended
- Backend CompanyChat.Api running on http://localhost:5000

## Install

```powershell
npm install
```

## Run

```powershell
npm run dev
```

Open:

http://localhost:5173

## Demo accounts

Employee:

tien / 123456

an / 123456

linh / 123456

Admin:

admin / Admin@123

## Flow

1. Login receives JWT.
2. JWT is saved to localStorage.
3. Axios automatically sends Authorization: Bearer JWT.
4. Frontend opens native WebSocket:
   ws://localhost:5000/ws/chat?access_token=JWT
5. Click another employee.
6. POST /api/conversations/private/{userId}
7. GET conversation messages.
8. Send messages through WebSocket.
9. Backend saves the message and sends it to both users.
