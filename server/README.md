# DeChat WebSocket Server

Real-time messaging server for DeChat application.

## Quick Start

```bash
npm install
npm start
```

Server runs on `http://localhost:3001`

## Features

- ✅ Real-time message delivery
- ✅ Private chat rooms
- ✅ Message history
- ✅ Message deletion sync
- ✅ Auto-reconnection
- ✅ CORS enabled for localhost:3000

## API

### Socket Events

**Client → Server:**
- `join` - Join with wallet address
- `join-chat` - Join a specific chat room
- `private-message` - Send a message
- `delete-message` - Delete a message
- `typing` - User is typing
- `stop-typing` - User stopped typing

**Server → Client:**
- `joined` - Confirmation of join
- `chat-history` - Previous messages
- `new-message` - New message received
- `message-deleted` - Message was deleted
- `chat-notification` - New message notification
- `user-typing` - Someone is typing
- `user-stop-typing` - Someone stopped typing

## Environment Variables

```bash
PORT=3001  # Server port (default: 3001)
```

## Production Deployment

### Render.com
1. Push to GitHub
2. Create Web Service
3. Set build command: `npm install`
4. Set start command: `npm start`

### Railway.app
```bash
railway login
railway init
railway up
```

## Health Check

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "connections": 2
}
```

## Development

```bash
npm install -g nodemon
npm run dev  # Auto-restart on changes
```

## License

MIT
