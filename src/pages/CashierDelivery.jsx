import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { currentBase } from '../lib/serverUrl'
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
      await fetch(`${currentBase}/api/urbanpiper/orders/${orderId}/status`, {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar restaurantName="Delivery Counter" />

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
