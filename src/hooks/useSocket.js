import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const BACKEND = import.meta.env.VITE_SAAS_API_URL || 'http://localhost:4000'

export const useSocket = (restaurantId, { onOrderUpdated, onKotSent, onOrderSettled, onOnlineOrder, onStockUpdate } = {}) => {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!restaurantId) return
    const socket = io(BACKEND, { transports: ['websocket'], reconnection: true })
    socketRef.current = socket

    socket.emit('join-restaurant', restaurantId)
    socket.on('order-updated', (order) => onOrderUpdated?.(order))
    socket.on('kot-sent', (data) => onKotSent?.(data))
    socket.on('order-settled', (data) => onOrderSettled?.(data))
    socket.on('online-order', (order) => onOnlineOrder?.(order))
    socket.on('STOCK_UPDATE', (data) => onStockUpdate?.(data))

    return () => socket.disconnect()
  }, [restaurantId])

  return socketRef
}
