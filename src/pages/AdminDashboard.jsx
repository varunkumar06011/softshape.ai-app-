import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import { getReportSummary, getActiveOrders, getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, getCaptainStats, getOnlineOrderReport, syncOnlineOrders } from '../saas/saasApi'
import { useSocket } from '../hooks/useSocket'
import { tables } from '../data/mockData'
import { DollarSign, Table, ShoppingCart, FileText, Printer, Bell, Package, Plus, UserCheck, Globe, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminDashboard = ({ restaurantId: propRestaurantId, onLogout }) => {
  const { slug: urlSlug } = useParams()
  const [summary, setSummary] = useState({ totalRevenue: 0, totalOrders: 0, dineInRevenue: 0, deliveryRevenue: 0 })
  const [activeOrders, setActiveOrders] = useState([])
  const [kotItems, setKotItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [inventory, setInventory] = useState([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', unit: 'pcs', currentStock: 0, lowStockAlert: 10, menuItemId: '' })
  const [captainStats, setCaptainStats] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [onlineReport, setOnlineReport] = useState(null)
  const [syncingOnline, setSyncingOnline] = useState(false)

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

  const fetchInventory = async () => {
    if (!restaurantId || !slug) return
    setInventoryLoading(true)
    try {
      const items = await getInventory(restaurantId, slug)
      setInventory(items || [])
    } catch (err) {
      toast.error(err.message || 'Failed to load inventory')
    } finally {
      setInventoryLoading(false)
    }
  }

  const fetchCaptainStats = async () => {
    if (!restaurantId || !slug) return
    try {
      const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const to = new Date().toISOString().slice(0, 10)
      const stats = await getCaptainStats(restaurantId, slug, from, to)
      setCaptainStats(stats || [])
    } catch (err) {
      // silently fail; card shows empty state
    }
  }

  const fetchOnlineReport = async () => {
    if (!restaurantId) return
    try {
      const report = await getOnlineOrderReport(restaurantId)
      setOnlineReport(report)
    } catch (err) {
      // silently fail
    }
  }

  const handleSyncOnline = async () => {
    if (!restaurantId) return
    setSyncingOnline(true)
    try {
      await syncOnlineOrders(restaurantId)
      await fetchOnlineReport()
      toast.success('Online orders synced')
    } catch (err) {
      toast.error(err.message || 'Sync failed')
    } finally {
      setSyncingOnline(false)
    }
  }

  useSocket(restaurantId, {
    onStockUpdate: () => { if (activeTab === 'inventory') fetchInventory() }
  })

  useEffect(() => { fetchData(); fetchCaptainStats(); fetchOnlineReport() }, [restaurantId, slug])
  useEffect(() => { if (activeTab === 'inventory') fetchInventory() }, [activeTab, restaurantId, slug])

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

  const handleStockEdit = (item) => {
    setEditingId(item.id)
    setEditValue(String(item.currentStock))
  }

  const handleStockSave = async (item) => {
    const val = parseFloat(editValue)
    if (isNaN(val)) { toast.error('Invalid number'); return }
    try {
      await updateInventoryItem(item.id, { currentStock: val }, slug)
      setInventory(prev => prev.map(it => it.id === item.id ? { ...it, currentStock: val } : it))
      setEditingId(null)
      toast.success('Stock updated')
    } catch (err) {
      toast.error(err.message || 'Failed to update')
    }
  }

  const handleAddItem = async () => {
    if (!addForm.name) { toast.error('Name is required'); return }
    try {
      const data = {
        restaurantId,
        ownerId: session?.ownerId || session?.id || '',
        name: addForm.name,
        unit: addForm.unit || 'pcs',
        currentStock: Number(addForm.currentStock) || 0,
        lowStockAlert: Number(addForm.lowStockAlert) || 10,
        menuItemId: addForm.menuItemId || null,
      }
      const item = await createInventoryItem(data, slug)
      setInventory(prev => [...prev, item])
      setShowAddModal(false)
      setAddForm({ name: '', unit: 'pcs', currentStock: 0, lowStockAlert: 10, menuItemId: '' })
      toast.success('Item added')
    } catch (err) {
      toast.error(err.message || 'Failed to add item')
    }
  }

  const handleDeleteItem = async (id) => {
    if (!confirm('Delete this inventory item?')) return
    try {
      await deleteInventoryItem(id, slug)
      setInventory(prev => prev.filter(it => it.id !== id))
      toast.success('Item deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete')
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-4 pt-16 lg:pt-8 lg:p-8 lg:ml-64">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'dashboard' ? 'bg-[#E53935] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'inventory' ? 'bg-[#E53935] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>Inventory</button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <>
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

                {/* Online Orders */}
                <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200 mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-orange-500" />
                      <h2 className="text-lg font-semibold">Online Orders</h2>
                    </div>
                    <button onClick={handleSyncOnline} disabled={syncingOnline} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs font-semibold hover:bg-orange-100 transition-colors disabled:opacity-50">
                      <RefreshCw className={`w-3.5 h-3.5 ${syncingOnline ? 'animate-spin' : ''}`} />
                      {syncingOnline ? 'Syncing...' : 'Sync Now'}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-orange-50 rounded-xl p-4 text-center">
                      <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wider mb-1">Swiggy</p>
                      <p className="text-xl font-bold text-slate-900">₹{Math.round(onlineReport?.SWIGGY?.total || 0).toLocaleString('en-IN')}</p>
                      <p className="text-xs text-slate-500">{onlineReport?.SWIGGY?.count || 0} orders</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 text-center">
                      <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1">Zomato</p>
                      <p className="text-xl font-bold text-slate-900">₹{Math.round(onlineReport?.ZOMATO?.total || 0).toLocaleString('en-IN')}</p>
                      <p className="text-xs text-slate-500">{onlineReport?.ZOMATO?.count || 0} orders</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Combined</p>
                      <p className="text-xl font-bold text-slate-900">₹{Math.round(onlineReport?.combined?.total || 0).toLocaleString('en-IN')}</p>
                      <p className="text-xs text-slate-500">{onlineReport?.combined?.count || 0} orders</p>
                    </div>
                  </div>
                </div>

                {/* Captain Performance */}
                <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200 mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <UserCheck className="w-5 h-5 text-blue-500" />
                    <h2 className="text-lg font-semibold">Captain Performance (last 7 days)</h2>
                  </div>
                  {captainStats.length === 0 ? (
                    <p className="text-sm text-gray-400">No settled orders yet</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={captainStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="captainName" />
                          <YAxis />
                          <Tooltip formatter={(value, name) => name === 'revenue' ? `₹${Math.round(value).toLocaleString()}` : value} />
                          <Legend />
                          <Bar dataKey="orders" fill="#E53935" name="Orders" />
                          <Bar dataKey="revenue" fill="#2E7D32" name="Revenue" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
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
          </>
        )}

        {activeTab === 'inventory' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold">Inventory</h2>
              </div>
              <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#E53935] text-white rounded-xl text-sm font-semibold hover:bg-[#C62828] transition-colors">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            {inventoryLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-12 bg-gray-200 rounded-xl" />
                <div className="h-12 bg-gray-200 rounded-xl" />
              </div>
            ) : inventory.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
                <p className="text-gray-400">No inventory items yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Item</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">Alert</th>
                      <th className="py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-sm">{item.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{item.unit}</td>
                        <td className="py-3 px-4">
                          {editingId === item.id ? (
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => handleStockSave(item)}
                              onKeyDown={(e) => e.key === 'Enter' && handleStockSave(item)}
                              className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E53935]"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => handleStockEdit(item)}
                              className={`text-sm font-bold px-2 py-1 rounded-lg transition-colors ${
                                item.currentStock <= item.lowStockAlert
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              {item.currentStock}
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">{item.lowStockAlert}</td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => handleDeleteItem(item.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {showAddModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                  <h3 className="text-lg font-bold mb-4">Add Inventory Item</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Name *</label>
                      <input type="text" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#E53935]" placeholder="e.g. Paneer" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Unit</label>
                        <input type="text" value={addForm.unit} onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })} className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#E53935]" placeholder="pcs / kg / ltr" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Initial Stock</label>
                        <input type="number" value={addForm.currentStock} onChange={(e) => setAddForm({ ...addForm, currentStock: e.target.value })} className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#E53935]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Low Stock Alert</label>
                      <input type="number" value={addForm.lowStockAlert} onChange={(e) => setAddForm({ ...addForm, lowStockAlert: e.target.value })} className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#E53935]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Linked Menu Item ID (optional)</label>
                      <input type="text" value={addForm.menuItemId} onChange={(e) => setAddForm({ ...addForm, menuItemId: e.target.value })} className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#E53935]" placeholder="menu item id" />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50">Cancel</button>
                    <button onClick={handleAddItem} className="flex-1 py-3 bg-[#E53935] text-white rounded-xl text-sm font-semibold hover:bg-[#C62828]">Save</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
