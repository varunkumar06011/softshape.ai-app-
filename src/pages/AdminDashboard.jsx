import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import { getReportSummary, getActiveOrders } from '../saas/saasApi'
import { tables } from '../data/mockData'
import { DollarSign, Table, ShoppingCart, FileText, Printer, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminDashboard = ({ restaurantId: propRestaurantId, onLogout }) => {
  const { slug: urlSlug } = useParams()
  const [summary, setSummary] = useState({ totalRevenue: 0, totalOrders: 0, dineInRevenue: 0, deliveryRevenue: 0 })
  const [activeOrders, setActiveOrders] = useState([])
  const [kotItems, setKotItems] = useState([])
  const [loading, setLoading] = useState(true)

  const session = (() => { try { const s = localStorage.getItem(`tenant_${urlSlug}_session`) || localStorage.getItem('saas_owner'); return s ? JSON.parse(s) : null } catch { return null } })()
  const restaurantId = propRestaurantId || session?.restaurantId || session?.slug || ''
  const slug = urlSlug || session?.slug || ''

  const groupedTables = tables.reduce((acc, table) => {
    if (!acc[table.section]) acc[table.section] = []
    acc[table.section].push(table)
    return acc
  }, {})

  const tableOrderMap = Object.fromEntries(activeOrders.map(o => [o.tableId, o]))

  const fetchData = async () => {
    if (!restaurantId || !slug) return
    setLoading(true)
    try {
      const [sum, orders] = await Promise.all([
        getReportSummary(restaurantId),
        getActiveOrders(restaurantId, slug),
      ])
      setSummary(sum || { totalRevenue: 0, totalOrders: 0, dineInRevenue: 0, deliveryRevenue: 0 })
      setActiveOrders(orders || [])
      // Build KOT feed from unsent items
      const kot = []
      for (const o of (orders || [])) {
        for (const it of (o.items || [])) {
          if (!it.kotSent) kot.push({ ...it, table: o.tableName, orderId: o.id })
        }
      }
      setKotItems(kot)
    } catch (err) {
      toast.error(err.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [restaurantId, slug])

  const today = new Date().toISOString().slice(0, 10)
  const todayOrders = activeOrders.filter(o => o.createdAt?.startsWith(today))
  const pendingKOTs = kotItems.length
  const activeTableCount = activeOrders.filter(o => o.status === 'OPEN').length

  const statusColor = (tableId) => {
    const o = tableOrderMap[tableId]
    if (!o) return 'bg-green-100 border-green-300 text-green-700'
    if (o.status === 'BILLED') return 'bg-red-100 border-red-300 text-red-700'
    return 'bg-orange-100 border-orange-300 text-orange-700'
  }

  const statusText = (tableId) => {
    const o = tableOrderMap[tableId]
    if (!o) return 'Free'
    if (o.status === 'BILLED') return 'Billed'
    return 'Occupied'
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-4 pt-16 lg:pt-8 lg:p-8 lg:ml-64">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-gray-200 rounded-2xl" />
            <div className="h-64 bg-gray-200 rounded-2xl" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
              <StatCard icon={DollarSign} label="Today's Revenue" value={`₹${Math.round(summary?.totalRevenue || 0).toLocaleString('en-IN')}`} />
              <StatCard icon={Table} label="Active Tables" value={`${activeTableCount}/${tables.length}`} />
              <StatCard icon={ShoppingCart} label="Orders Today" value={String(todayOrders.length)} />
              <StatCard icon={FileText} label="Pending KOTs" value={String(pendingKOTs)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Live Table Map */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold mb-4">Live Table Map</h2>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {Object.entries(groupedTables).map(([section, sectionTables]) => (
                    <div key={section}>
                      <h3 className="font-semibold mb-2 text-sm text-gray-500">{section}</h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                        {sectionTables.map((table) => (
                          <div key={table.id} className={`p-3 rounded-xl border-2 text-center ${statusColor(table.id)}`}>
                            <p className="font-bold text-sm">{table.label}</p>
                            <p className="text-[10px] capitalize">{statusText(table.id)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* KOT Feed */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Pending KOTs</h2>
                  {pendingKOTs > 0 && <Bell className="w-5 h-5 text-orange-500 animate-bounce" />}
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {kotItems.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">All items sent to kitchen</p>
                  )}
                  {kotItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{item.name}</span>
                        <span className="text-sm font-bold">x{item.qty}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Table {item.table}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200 overflow-x-auto">
              <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Table</th>
                    <th className="text-left py-3 px-4">Items</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOrders.slice(0, 10).map((order) => (
                    <tr key={order.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">{order.tableName}</td>
                      <td className="py-3 px-4 text-sm">{(order.items || []).map(i => i.name).join(', ')}</td>
                      <td className="py-3 px-4 font-semibold">₹{Math.round(order.total || 0)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'SETTLED' ? 'bg-green-100 text-green-800'
                          : order.status === 'BILLED' ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'OPEN' ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}>{order.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
