import { useState, useEffect } from 'react'
import { deliveryOrders as initialDeliveryOrders } from '../data/mockData'
import toast from 'react-hot-toast'

export const useSocketSim = () => {
  const [deliveryOrders, setDeliveryOrders] = useState(initialDeliveryOrders)
  const [kotEvents, setKotEvents] = useState([])
  const [tableUpdates, setTableUpdates] = useState([])

  useEffect(() => {
    // Simulate new delivery orders every 30 seconds
    const deliveryInterval = setInterval(() => {
      const platforms = ['swiggy', 'zomato']
      const names = ['Amit K', 'Sneha P', 'Vikram S', 'Neha R', 'Rahul M']
      const newOrder = {
        id: `d${Date.now()}`,
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        customerName: names[Math.floor(Math.random() * names.length)],
        items: [
          { name: 'Butter Chicken', qty: 1, price: 320 },
          { name: 'Naan', qty: 2, price: 60 }
        ],
        total: 440,
        status: 'new',
        time: 'Just now'
      }
      setDeliveryOrders(prev => [newOrder, ...prev])
      toast.success(`New ${newOrder.platform.toUpperCase()} order arrived!`)
    }, 30000)

    // Simulate KOT print events every 20 seconds
    const kotInterval = setInterval(() => {
      const newKot = {
        id: `kot${Date.now()}`,
        table: `AC-${Math.floor(Math.random() * 3) + 1}`,
        items: ['Paneer Butter Masala x2', 'Butter Naan x4'],
        time: new Date().toLocaleTimeString(),
        status: 'PRINTED'
      }
      setKotEvents(prev => [newKot, ...prev.slice(0, 9)])
    }, 20000)

    // Simulate table status changes every 45 seconds
    const tableInterval = setInterval(() => {
      const tableId = `t${Math.floor(Math.random() * 8) + 1}`
      const statuses = ['free', 'occupied', 'bill-requested']
      const newStatus = statuses[Math.floor(Math.random() * statuses.length)]
      setTableUpdates(prev => [{ tableId, status: newStatus, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)])
    }, 45000)

    return () => {
      clearInterval(deliveryInterval)
      clearInterval(kotInterval)
      clearInterval(tableInterval)
    }
  }, [])

  return { deliveryOrders, kotEvents, tableUpdates }
}
