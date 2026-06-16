import { useState, useEffect } from 'react'
<<<<<<< HEAD
import { io } from 'socket.io-client'
import TopBar from '../components/TopBar'
import OrderCard from '../components/OrderCard'
import { menuItems } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { getOnlineOrders, updateOnlineOrderStatus } from '../saas/saasApi'
import { smartPrintKOT } from '../utils/printTemplates'
import { Plus, X, Search, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const BACKEND = import.meta.env.VITE_SAAS_API_URL || 'http://localhost:4000'

const STATUS_BADGES = {
  NEW: 'bg-red-100 text-red-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-yellow-100 text-yellow-800',
  READY: 'bg-green-100 text-green-800',
  DISPATCHED: 'bg-gray-100 text-gray-800',
  rejected: 'bg-gray-200 text-gray-600',
}

const PLATFORM_COLORS = {
  swiggy: 'bg-orange-100 text-orange-800',
  zomato: 'bg-red-100 text-red-800',
}

const CashierDelivery = ({ restaurantId }) => {
  const { user, logout } = useAuth()
  const [onlineOrders, setOnlineOrders] = useState([])
  const [newAlert, setNewAlert] = useState(false)
  const [showAddOrder, setShowAddOrder] = useState(false)
  const [showWalkIn, setShowWalkIn] = useState(false)
  const [walkInOrders, setWalkInOrders] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [manualOrder, setManualOrder] = useState({ platform: 'swiggy', customerName: '', items: '', total: '' })

  useEffect(() => {
    if (!restaurantId) return
    const fetchOrders = async () => {
      try {
        const data = await getOnlineOrders(restaurantId)
        setOnlineOrders(data || [])
      } catch (err) {
        console.error('Failed to load online orders:', err)
      }
    }
    fetchOrders()

    const socket = io(BACKEND, { transports: ['websocket'], reconnection: true })
    socket.emit('join-restaurant', restaurantId)
    socket.on('online-order', (order) => {
      setOnlineOrders(prev => {
        const exists = prev.find(o => o.id === order.id)
        if (exists) return prev.map(o => o.id === order.id ? order : o)
        setNewAlert(true)
        try { new Audio('/notification.mp3').play().catch(() => {}) } catch {}
        return [order, ...prev]
      })
    })
    socket.on('online-order-status', ({ id, status }) => {
      setOnlineOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    })
    return () => socket.disconnect()
  }, [restaurantId])

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await updateOnlineOrderStatus(orderId, status)
      setOnlineOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
      toast.success(`Order marked as ${status}`)
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const handleAcceptOrder = (order) => {
    handleStatusUpdate(order.id, 'ACCEPTED')
    smartPrintKOT({
      kotNumber: 'K-' + Date.now().toString().slice(-6),
      table: order.platform?.toUpperCase() || 'DELIVERY',
      section: order.customerName || '-',
      captain: user?.name || '-',
      items: (order.items || []).map(i => ({ name: i.name, qty: i.qty || 1 })),
      createdAt: new Date().toISOString(),
      restaurantName: 'VGrand Restaurant'
    })
  }

  const handleAddWalkInItem = (item) => {
    setSelectedItems([...selectedItems, { ...item, qty: 1 }])
  }

  const handleCreateWalkInOrder = () => {
    if (selectedItems.length > 0) {
      setWalkInOrders([...walkInOrders, {
        id: `w${Date.now()}`,
        items: selectedItems,
        total: selectedItems.reduce((sum, item) => sum + item.price, 0),
        status: 'new',
        time: 'Just now'
      }])
      setSelectedItems([])
      setShowWalkIn(false)
      toast.success('Walk-in order created')
    }
  }

  const handleManualOrder = () => {
    if (manualOrder.customerName && manualOrder.total) {
      setOnlineOrders([...onlineOrders, {
        id: `m${Date.now()}`,
        platform: manualOrder.platform,
        customerName: manualOrder.customerName,
        items: manualOrder.items.split(',').map(name => ({ name: name.trim(), qty: 1, price: 0 })),
        total: parseInt(manualOrder.total),
        status: 'NEW',
        time: 'Just now'
      }])
      setManualOrder({ platform: 'swiggy', customerName: '', items: '', total: '' })
      setShowAddOrder(false)
      toast.success('Manual order added')
    }
  }

  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

=======
import { useParams } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { getOnlineOrders } from '../saas/saasApi'
import { Plus, X, Search, Clock, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_BADGES = {
  NEW: { text: 'Incoming', class: 'bg-yellow-100 text-yellow-800 animate-pulse' },
  ACCEPTED: { text: 'Accepted', class: 'bg-blue-100 text-blue-800' },
  PREPARING: { text: 'In Kitchen', class: 'bg-orange-100 text-orange-800' },
  READY: { text: 'Ready', class: 'bg-green-100 text-green-800' },
  DISPATCHED: { text: 'Dispatched', class: 'bg-gray-100 text-gray-800' },
  CANCELLED: { text: 'Cancelled', class: 'bg-red-100 text-red-800' },
}

const PLATFORM_COLORS = {
  swiggy: 'bg-orange-500',
  zomato: 'bg-red-600',
}

const CashierDelivery = () => {
  const { slug: urlSlug } = useParams()
  const session = (() => { try { const s = localStorage.getItem(`tenant_${urlSlug}_session`) || localStorage.getItem('saas_owner'); return s ? JSON.parse(s) : null } catch { return null } })()
  const restaurantId = session?.restaurantId || ''
  const slug = urlSlug || session?.slug || ''

  const [onlineOrders, setOnlineOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [newAlert, setNewAlert] = useState(false)

  const fetchOrders = async () => {
    if (!restaurantId) return
    try {
      const data = await getOnlineOrders(restaurantId)
      const orders = Array.isArray(data) ? data : []
      const hasNew = orders.some(o => o.status === 'NEW')
      if (hasNew && !newAlert) {
        setNewAlert(true)
        try { new Audio('/notification.mp3').play().catch(() => {}) } catch {}
      }
      setOnlineOrders(orders)
    } catch (err) {
      // silently fail on polling
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 15000)
    return () => clearInterval(interval)
  }, [restaurantId])

  const markReady = async (orderId) => {
    try {
      const token = localStorage.getItem('saas_token')
      await fetch(`http://localhost:4000/api/urbanpiper/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ status: 'READY' }),
      })
      fetchOrders()
      toast.success('Marked ready')
    } catch (err) {
      toast.error('Failed to update')
    }
  }

>>>>>>> e7e9141d7f881a36cb4af153ea5a46377582488c
  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar restaurantName="Delivery Counter" />

<<<<<<< HEAD
      <div className="flex h-[calc(100vh-73px)]">
        <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Delivery Orders</h2>
            <button
              onClick={() => setShowAddOrder(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              Manual Entry
            </button>
          </div>

          <div className="space-y-4">
            {onlineOrders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${PLATFORM_COLORS[order.platform] || 'bg-gray-100 text-gray-700'}`}>
                    {order.platform?.toUpperCase() || 'ONLINE'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGES[order.status] || 'bg-gray-100 text-gray-700'}`}>
                    {order.status}
                  </span>
                </div>
                <p className="font-semibold mb-1">{order.customerName || 'Customer'}</p>
                <div className="text-sm text-gray-600 mb-2">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx}>{item.name} x {item.qty || 1}</div>
                  ))}
                </div>
                <p className="font-bold mb-3">₹{order.total || 0}</p>
                <div className="flex gap-2">
                  {order.status === 'NEW' && (
                    <button
                      onClick={() => handleAcceptOrder(order)}
                      className="flex-1 py-2 bg-brand text-white rounded-xl text-sm hover:bg-brand-dark transition-colors"
                    >
                      Accept
                    </button>
                  )}
                  {order.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'PREPARING')}
                      className="flex-1 py-2 bg-yellow-500 text-white rounded-xl text-sm hover:bg-yellow-600 transition-colors"
                    >
                      Mark Preparing
                    </button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'READY')}
                      className="flex-1 py-2 bg-green-500 text-white rounded-xl text-sm hover:bg-green-600 transition-colors"
                    >
                      Mark Ready
                    </button>
                  )}
                  {order.status === 'READY' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'DISPATCHED')}
                      className="flex-1 py-2 bg-gray-700 text-white rounded-xl text-sm hover:bg-gray-800 transition-colors"
                    >
                      Dispatch
                    </button>
                  )}
                </div>
              </div>
            ))}
=======
      <div className="p-4 pt-16 lg:pt-8 lg:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">Online Orders</h2>
            {newAlert && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
>>>>>>> e7e9141d7f881a36cb4af153ea5a46377582488c
          </div>
          <button onClick={() => setNewAlert(false)} className="text-sm text-gray-500 hover:text-gray-700">
            Clear alert
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {onlineOrders.length === 0 && (
              <div className="text-center py-12 text-gray-500">No online orders yet</div>
            )}
            {onlineOrders.map((order) => {
              const badge = STATUS_BADGES[order.status] || STATUS_BADGES.NEW
              const items = Array.isArray(order.items) ? order.items : []
              return (
                <div key={order.id} className="bg-white border border-gray-200 rounded-2xl p-4 lg:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`${PLATFORM_COLORS[order.platform] || 'bg-gray-500'} text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded`}>
                        {order.platform}
                      </span>
                      <span className="font-semibold">{order.customerName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.class}`}>{badge.text}</span>
                    </div>
                    <span className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3 space-y-1">
                    {items.map((it, idx) => (
                      <div key={idx}>{it.name} x {it.qty || 1}</div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="font-bold text-lg">₹{Math.round(order.total)}</p>
                    {(order.status === 'ACCEPTED' || order.status === 'PREPARING') && (
                      <button onClick={() => markReady(order.id)} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
                        Mark Ready
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default CashierDelivery
