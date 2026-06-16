import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { currentBase } from '../lib/serverUrl'

export const useSocket = (restaurantId, { onOrderUpdated, onKotSent, onOrderSettled, onOnlineOrder, onStockUpdate, onOrderExcluded, onBillReopened } = {}) => {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!restaurantId) return
    const socket = io(currentBase, { transports: ['websocket'], reconnection: true })
    socketRef.current = socket

    socket.emit('join-restaurant', restaurantId)
    socket.on('order-updated', (order) => onOrderUpdated?.(order))
    socket.on('kot-sent', (data) => onKotSent?.(data))
    socket.on('order-settled', (data) => onOrderSettled?.(data))
    socket.on('online-order', (order) => onOnlineOrder?.(order))
    socket.on('STOCK_UPDATE', (data) => onStockUpdate?.(data))
    socket.on('order-excluded', (data) => onOrderExcluded?.(data))
    socket.on('bill-reopened', (data) => onBillReopened?.(data))

    return () => socket.disconnect()
  }, [restaurantId])

  return socketRef
}
