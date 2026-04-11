import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:5000' // Points to our Express backend

let socket

export const initSocket = (userId) => {
  if (socket) {
    socket.disconnect()
  }

  socket = io(SOCKET_URL, {
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id)
    if (userId) {
      socket.emit('register', userId)
    }
  })

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error)
  })

  return socket
}

export const getSocket = () => {
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const onNotification = (callback) => {
  if (!socket) return
  socket.on('new_notification', callback)
}

export const offNotification = (callback) => {
  if (!socket) return
  socket.off('new_notification', callback)
}
