import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? ''

    if (!url) {
      socket = createNoopSocket()
      return socket
    }

    socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: false,
    })

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

  if (!socket.connected && process.env.NEXT_PUBLIC_SOCKET_URL) {
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

function createNoopSocket(): Socket {
  const noop = () => {}
  const noopSocket = {
    connected: false,
    id: undefined,
    on: () => noopSocket,
    off: () => noopSocket,
    emit: () => noopSocket,
    connect: noop,
    disconnect: noop,
    join: noop,
    leave: noop,
  } as unknown as Socket
  return noopSocket
}
