// server.ts  (place this in your PROJECT ROOT, same level as package.json)
// This replaces the default Next.js server so Socket.io can run alongside it.
//
// To use this server:
//   1. Place this file at the project root
//   2. Install: npm install http socket.io
//   3. Update package.json scripts (see bottom of this file)
//   4. Run: npm run dev  (it will use this server instead of next dev)

import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer, Socket } from 'socket.io'

const dev  = process.env.NODE_ENV !== 'production'
const host = process.env.HOST ?? 'localhost'
const port = parseInt(process.env.PORT ?? '3000', 10)

const app    = next({ dev, hostname: host, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  // ── Create HTTP server ─────────────────────────────────────────────────────
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  // ── Attach Socket.io to the HTTP server ────────────────────────────────────
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin:  dev ? 'http://localhost:3000' : process.env.NEXTAUTH_URL,
      methods: ['GET', 'POST'],
    },
    // Use websocket first, fall back to polling
    transports: ['websocket', 'polling'],
  })

  // ── Socket.io connection handler ───────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`)

    // ── JOIN a program discussion room ──────────────────────────────────────
    // Client emits: socket.emit('join-program', programId)
    socket.on('join-program', (programId: string) => {
      socket.join(`program:${programId}`)
      console.log(`[Socket.io] ${socket.id} joined program:${programId}`)
    })

    // ── LEAVE a program discussion room ────────────────────────────────────
    // Client emits: socket.emit('leave-program', programId)
    socket.on('leave-program', (programId: string) => {
      socket.leave(`program:${programId}`)
      console.log(`[Socket.io] ${socket.id} left program:${programId}`)
    })

    // ── NEW MESSAGE broadcast ───────────────────────────────────────────────
    // Client emits: socket.emit('new-message', messageObject)
    // Server broadcasts to everyone else in the same program room
    socket.on('new-message', (data: {
      id:        string
      programId: string
      message:   string
      createdAt: string
      user: {
        id:     string
        name:   string
        avatar: string | null
      }
      likes: number
    }) => {
      // Validate data before broadcasting
      if (!data.programId || !data.message) return

      // Broadcast to all OTHER clients in this program room (not the sender)
      socket.to(`program:${data.programId}`).emit('message', data)

      console.log(`[Socket.io] Message in program:${data.programId} from ${data.user.name}`)
    })

    // ── LIKE broadcast ──────────────────────────────────────────────────────
    // Client emits: socket.emit('like-message', { messageId, programId })
    socket.on('like-message', (data: { messageId: string; programId: string }) => {
      if (!data.messageId || !data.programId) return
      // Broadcast updated like count to the room
      socket.to(`program:${data.programId}`).emit('message-liked', {
        messageId: data.messageId,
      })
    })

    // ── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id} — ${reason}`)
    })
  })

  // ── Start listening ────────────────────────────────────────────────────────
  httpServer.listen(port, () => {
    console.log(`✅ Server running at http://${host}:${port}`)
    console.log(`🔌 Socket.io attached and ready`)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE YOUR package.json scripts to use this server:
//
// "scripts": {
//   "dev":   "ts-node --project tsconfig.server.json server.ts",
//   "build": "next build",
//   "start": "NODE_ENV=production ts-node --project tsconfig.server.json server.ts"
// }
//
// Also install ts-node if you haven't:
//   npm install -D ts-node
//
// And create tsconfig.server.json in the project root:
// (see tsconfig.server.json file provided separately)
// ─────────────────────────────────────────────────────────────────────────────