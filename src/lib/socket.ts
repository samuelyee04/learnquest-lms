// src/lib/socket.ts
// Socket.io CLIENT singleton.
// Import this in any React component that needs real-time features.
//
// Usage:
//   import { getSocket } from '@/lib/socket'
//   const socket = getSocket()
//   socket.emit('join-program', programId)
//   socket.on('message', (data) => { ... })

import { io, Socket } from 'socket.io-client'

// Module-level singleton — one socket for the whole app
let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(
      // In production, connect to your deployed server URL.
      // In dev, connects to localhost:3000 (same as Next.js).
      process.env.NEXT_PUBLIC_SOCKET_URL ?? '',
      {
        // Start with WebSocket, fall back to long-polling
        transports:         ['websocket', 'polling'],
        // Reconnect automatically on disconnect
        reconnection:       true,
        reconnectionAttempts: 5,
        reconnectionDelay:  1000,
        // Don't auto-connect — we connect manually when needed
        autoConnect:        false,
      }
    )

    socket.on('connect', () => {
      console.log('[Socket.io] Connected:', socket?.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('[Socket.io] Disconnected:', reason)
    })

    socket.on('connect_error', (err) => {
      console.error('[Socket.io] Connection error:', err.message)
    })
  }

  // Connect if not already connected
  if (!socket.connected) {
    socket.connect()
  }

  return socket
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect()
    socket = null
  }
}