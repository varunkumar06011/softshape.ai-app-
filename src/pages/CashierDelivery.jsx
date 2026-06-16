import { useState, useEffect } from 'react'
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

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar restaurantName="VGrand Restaurant" />

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
          </div>
        </div>

        <div className="w-1/2 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Walk-In / Parcel</h2>
            <button
              onClick={() => setShowWalkIn(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Walk-In Order
            </button>
          </div>

          <div className="space-y-4">
            {walkInOrders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">{order.time}</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    {order.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {order.items.map((item, idx) => (
                    <div key={idx}>{item.name} x {item.qty}</div>
                  ))}
                </div>
                <p className="font-bold">₹{order.total}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showWalkIn && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl p-6 z-50 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">New Walk-In Order</h2>
            <button onClick={() => setShowWalkIn(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
            />
          </div>
          <div className="space-y-2 mb-6">
            {filteredMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleAddWalkInItem(item)}
                className="w-full p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </div>
                  <p className="font-bold">₹{item.price}</p>
                </div>
              </button>
            ))}
          </div>
          {selectedItems.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-semibold mb-3">Selected Items</h3>
              <div className="space-y-2 mb-4">
                {selectedItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.name}</span>
                    <span>₹{item.price}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold mb-4">
                <span>Total</span>
                <span>₹{selectedItems.reduce((sum, item) => sum + item.price, 0)}</span>
              </div>
              <button
                onClick={handleCreateWalkInOrder}
                className="w-full py-3 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors"
              >
                Create Order
              </button>
            </div>
          )}
        </div>
      )}

      {showAddOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Manual Order Entry</h2>
              <button onClick={() => setShowAddOrder(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Platform</label>
                <select
                  value={manualOrder.platform}
                  onChange={(e) => setManualOrder({ ...manualOrder, platform: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
                >
                  <option value="swiggy">Swiggy</option>
                  <option value="zomato">Zomato</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Customer Name</label>
                <input
                  type="text"
                  value={manualOrder.customerName}
                  onChange={(e) => setManualOrder({ ...manualOrder, customerName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Items (comma separated)</label>
                <input
                  type="text"
                  value={manualOrder.items}
                  onChange={(e) => setManualOrder({ ...manualOrder, items: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
                  placeholder="Item 1, Item 2, Item 3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total</label>
                <input
                  type="number"
                  value={manualOrder.total}
                  onChange={(e) => setManualOrder({ ...manualOrder, total: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
                />
              </div>
              <button
                onClick={handleManualOrder}
                className="w-full py-3 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors"
              >
                Add Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CashierDelivery
