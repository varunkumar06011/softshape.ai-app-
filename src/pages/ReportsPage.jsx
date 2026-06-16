import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import { getReportSummary, getDailyReport, getChannelBreakdown, getTopItems, getItemRevenue, getPaymentModeReport, getCashierPerformance, getExcludedTransactions } from '../saas/saasApi'
import { DollarSign, ShoppingCart, Users, TrendingUp, Download, PieChart, BarChart3, CreditCard, BadgePercent, ClipboardList, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const ReportsPage = () => {
  const { slug: urlSlug } = useParams()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [summary, setSummary] = useState(null)
  const [daily, setDaily] = useState([])
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('summary')
  const [reportData, setReportData] = useState({})

  const session = (() => {
    try {
      const s = localStorage.getItem(`tenant_${urlSlug}_session`) || localStorage.getItem('saas_owner')
      return s ? JSON.parse(s) : null
    } catch { return null }
  })()
  const restaurantId = session?.restaurantId || session?.slug || ''
  const slug = urlSlug || session?.slug || ''

  const fetchAll = async () => {
    if (!restaurantId || !slug) return
    setLoading(true)
    try {
      const [sum, day, ch] = await Promise.all([
        getReportSummary(restaurantId, startDate || undefined, endDate || undefined),
        getDailyReport(restaurantId, startDate || undefined, endDate || undefined),
        getChannelBreakdown(restaurantId, startDate || undefined, endDate || undefined),
      ])
      setSummary(sum)
      setDaily(day)
      setChannels(ch)
    } catch (err) {
      toast.error(err.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const fetchTabData = async (tab) => {
    if (!restaurantId) return
    setLoading(true)
    try {
      const from = startDate || undefined
      const to = endDate || undefined
      let data
      switch (tab) {
        case 'top-items': data = await getTopItems(restaurantId, from, to); break
        case 'item-revenue': data = await getItemRevenue(restaurantId, from, to); break
        case 'payment-mode': data = await getPaymentModeReport(restaurantId, from, to); break
        case 'cashier-performance': data = await getCashierPerformance(restaurantId, from, to); break
        case 'deleted': data = await getExcludedTransactions(restaurantId, from, to); break
        default: break
      }
      if (data !== undefined) setReportData(prev => ({ ...prev, [tab]: data }))
    } catch (err) {
      toast.error(err.message || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [restaurantId, slug, startDate, endDate])
  useEffect(() => {
    if (['top-items', 'item-revenue', 'payment-mode', 'cashier-performance', 'deleted'].includes(activeTab)) {
      fetchTabData(activeTab)
    }
  }, [activeTab, restaurantId, startDate, endDate])

  const exportCSV = () => {
    if (!channels.length) return
    const rows = [
      ['Channel', 'Orders', 'Revenue', 'Avg Order Value'],
      ...channels.map(c => [c.channel, c.orders, c.revenue, Math.round(c.avgOrder)]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `channel-breakdown-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const Skeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-24 bg-gray-200 rounded-2xl" />
      <div className="h-24 bg-gray-200 rounded-2xl" />
      <div className="h-64 bg-gray-200 rounded-2xl" />
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-4 pt-16 lg:pt-8 lg:p-8 lg:ml-64">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Reports</h1>
          <div className="flex gap-2 flex-wrap">
            {['summary', 'sales', 'top-items', 'item-revenue', 'discounts', 'gst', 'payment-mode', 'cashier-performance', 'deleted'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === tab ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {tab === 'summary' && 'Summary'}
                {tab === 'sales' && 'Sales'}
                {tab === 'top-items' && 'Top Items'}
                {tab === 'item-revenue' && 'Item Revenue'}
                {tab === 'discounts' && 'Discounts'}
                {tab === 'gst' && 'GST'}
                {tab === 'payment-mode' && 'Payment'}
                {tab === 'cashier-performance' && 'Cashier'}
                {tab === 'deleted' && 'Deleted'}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'summary' && (
          <>
            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-brand" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-brand" />
                </div>
                <button onClick={exportCSV} disabled={!channels.length} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50">
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>

            {loading ? <Skeleton /> : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                  <StatCard icon={DollarSign} label="Total Revenue" value={`₹${Math.round(summary?.totalRevenue || 0).toLocaleString('en-IN')}`} />
                  <StatCard icon={ShoppingCart} label="Dine-In Revenue" value={`₹${Math.round(summary?.dineInRevenue || 0).toLocaleString('en-IN')}`} />
                  <StatCard icon={Users} label="Delivery Revenue" value={`₹${Math.round(summary?.deliveryRevenue || 0).toLocaleString('en-IN')}`} />
                  <StatCard icon={TrendingUp} label="Total Orders" value={String(summary?.totalOrders || 0)} />
                </div>

                <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200 mb-8">
                  <h2 className="text-lg font-semibold mb-4">Revenue Trend</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={daily}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="dineIn" stroke="#E02020" name="Dine-In" />
                      <Line type="monotone" dataKey="delivery" stroke="#B91C1C" name="Delivery" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200 overflow-x-auto">
                  <h2 className="text-lg font-semibold mb-4">Channel Breakdown</h2>
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4">Channel</th>
                        <th className="text-left py-3 px-4">Orders</th>
                        <th className="text-left py-3 px-4">Revenue</th>
                        <th className="text-left py-3 px-4">Avg Order Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {channels.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-3 px-4 font-medium">{row.channel}</td>
                          <td className="py-3 px-4">{row.orders}</td>
                          <td className="py-3 px-4 font-semibold">₹{Math.round(row.revenue).toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4">₹{Math.round(row.avgOrder)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'sales' && (
          <SalesReport summary={summary} loading={loading} />
        )}

        {activeTab === 'top-items' && (
          <TopItemsReport data={reportData['top-items']} loading={loading} />
        )}

        {activeTab === 'item-revenue' && (
          <ItemRevenueReport data={reportData['item-revenue']} loading={loading} />
        )}

        {activeTab === 'discounts' && (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
            <BadgePercent className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-2">Discounts</h2>
            <p className="text-gray-500">Coming soon</p>
          </div>
        )}

        {activeTab === 'gst' && (
          <GSTReport summary={summary} loading={loading} />
        )}

        {activeTab === 'payment-mode' && (
          <PaymentModeReport data={reportData['payment-mode']} loading={loading} />
        )}

        {activeTab === 'cashier-performance' && (
          <CashierPerformanceReport data={reportData['cashier-performance']} loading={loading} />
        )}

        {activeTab === 'deleted' && (
          <DeletedTransactionsReport data={reportData['deleted']} loading={loading} />
        )}

        {activeTab === 'transactions' && (
          <TransactionList restaurantId={restaurantId} slug={slug} />
        )}
      </div>
    </div>
  )
}

function SalesReport({ summary, loading }) {
  if (loading) return <div className="animate-pulse space-y-4"><div className="h-24 bg-gray-200 rounded-2xl" /><div className="h-24 bg-gray-200 rounded-2xl" /></div>
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <StatCard icon={DollarSign} label="Total Revenue" value={`₹${Math.round(summary?.totalRevenue || 0).toLocaleString('en-IN')}`} />
        <StatCard icon={ShoppingCart} label="Total Orders" value={String(summary?.totalOrders || 0)} />
        <StatCard icon={TrendingUp} label="CGST Collected" value={`₹${Math.round(summary?.totalCGST || 0).toLocaleString('en-IN')}`} />
        <StatCard icon={TrendingUp} label="SGST Collected" value={`₹${Math.round(summary?.totalSGST || 0).toLocaleString('en-IN')}`} />
      </div>
      <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Total GST</h2>
        <p className="text-2xl font-bold">₹{Math.round((summary?.totalCGST || 0) + (summary?.totalSGST || 0)).toLocaleString('en-IN')}</p>
      </div>
    </>
  )
}

function TopItemsReport({ data, loading }) {
  if (loading) return <div className="animate-pulse space-y-4"><div className="h-16 bg-gray-200 rounded-2xl" /><div className="h-16 bg-gray-200 rounded-2xl" /></div>
  const items = data || []
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
      <table className="w-full min-w-[400px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4">#</th>
            <th className="text-left py-3 px-4">Item</th>
            <th className="text-left py-3 px-4">Qty Sold</th>
            <th className="text-left py-3 px-4">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx} className="border-b border-gray-100">
              <td className="py-3 px-4 text-sm text-gray-500">{idx + 1}</td>
              <td className="py-3 px-4 font-medium">{it.name}</td>
              <td className="py-3 px-4">{it.qty}</td>
              <td className="py-3 px-4 font-semibold">₹{Math.round(it.revenue).toLocaleString('en-IN')}</td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-400 text-sm">No data</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function ItemRevenueReport({ data, loading }) {
  if (loading) return <div className="animate-pulse space-y-4"><div className="h-16 bg-gray-200 rounded-2xl" /><div className="h-16 bg-gray-200 rounded-2xl" /></div>
  const items = data || []
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
      <table className="w-full min-w-[500px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4">Category</th>
            <th className="text-left py-3 px-4">Item</th>
            <th className="text-left py-3 px-4">Qty Sold</th>
            <th className="text-left py-3 px-4">Unit Price</th>
            <th className="text-left py-3 px-4">Total Revenue</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx} className="border-b border-gray-100">
              <td className="py-3 px-4 text-sm text-gray-500">{it.category}</td>
              <td className="py-3 px-4 font-medium">{it.name}</td>
              <td className="py-3 px-4">{it.qtySold}</td>
              <td className="py-3 px-4">₹{it.unitPrice}</td>
              <td className="py-3 px-4 font-semibold">₹{Math.round(it.totalRevenue).toLocaleString('en-IN')}</td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-400 text-sm">No data</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function GSTReport({ summary, loading }) {
  if (loading) return <div className="animate-pulse space-y-4"><div className="h-24 bg-gray-200 rounded-2xl" /><div className="h-24 bg-gray-200 rounded-2xl" /></div>
  const cgst = summary?.totalCGST || 0
  const sgst = summary?.totalSGST || 0
  const totalGst = cgst + sgst
  const gross = summary?.totalRevenue || 0
  const taxable = gross - totalGst
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard icon={BadgePercent} label="CGST (2.5%)" value={`₹${Math.round(cgst).toLocaleString('en-IN')}`} />
      <StatCard icon={BadgePercent} label="SGST (2.5%)" value={`₹${Math.round(sgst).toLocaleString('en-IN')}`} />
      <StatCard icon={TrendingUp} label="Total GST" value={`₹${Math.round(totalGst).toLocaleString('en-IN')}`} />
      <StatCard icon={DollarSign} label="Taxable Amount" value={`₹${Math.round(taxable).toLocaleString('en-IN')}`} />
      <StatCard icon={DollarSign} label="Gross Revenue" value={`₹${Math.round(gross).toLocaleString('en-IN')}`} />
    </div>
  )
}

function PaymentModeReport({ data, loading }) {
  if (loading) return <div className="animate-pulse space-y-4"><div className="h-24 bg-gray-200 rounded-2xl" /></div>
  const modes = data || { cash: { orders: 0, revenue: 0 }, upi: { orders: 0, revenue: 0 }, card: { orders: 0, revenue: 0 } }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Object.entries(modes).map(([key, val]) => (
        <div key={key} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500 font-semibold uppercase mb-2">{key}</p>
          <p className="text-2xl font-bold mb-1">{val.orders} orders</p>
          <p className="text-lg text-gray-700">₹{Math.round(val.revenue).toLocaleString('en-IN')}</p>
        </div>
      ))}
    </div>
  )
}

function CashierPerformanceReport({ data, loading }) {
  if (loading) return <div className="animate-pulse space-y-4"><div className="h-16 bg-gray-200 rounded-2xl" /></div>
  const items = data || []
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
      <table className="w-full min-w-[400px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4">Cashier</th>
            <th className="text-left py-3 px-4">Orders</th>
            <th className="text-left py-3 px-4">Revenue</th>
            <th className="text-left py-3 px-4">Avg Order</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx} className="border-b border-gray-100">
              <td className="py-3 px-4 font-medium">{it.cashierName}</td>
              <td className="py-3 px-4">{it.orders}</td>
              <td className="py-3 px-4 font-semibold">₹{Math.round(it.revenue).toLocaleString('en-IN')}</td>
              <td className="py-3 px-4">₹{it.avgOrderValue}</td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-400 text-sm">No data</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function DeletedTransactionsReport({ data, loading }) {
  if (loading) return <div className="animate-pulse space-y-4"><div className="h-16 bg-gray-200 rounded-2xl" /></div>
  const items = data || []
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
      <table className="w-full min-w-[500px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4">Bill #</th>
            <th className="text-left py-3 px-4">Table</th>
            <th className="text-left py-3 px-4">Amount</th>
            <th className="text-left py-3 px-4">Excluded At</th>
            <th className="text-left py-3 px-4">By</th>
            <th className="text-left py-3 px-4">Reason</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-b border-gray-100">
              <td className="py-3 px-4 font-medium">{it.billNumber || it.id.slice(-6)}</td>
              <td className="py-3 px-4">{it.tableName}</td>
              <td className="py-3 px-4 font-semibold">₹{Math.round(it.total).toLocaleString('en-IN')}</td>
              <td className="py-3 px-4 text-sm text-gray-500">{it.excludedAt ? new Date(it.excludedAt).toLocaleString('en-IN') : '-'}</td>
              <td className="py-3 px-4 text-sm">{it.excludedBy || '-'}</td>
              <td className="py-3 px-4 text-sm text-red-600">{it.excludedReason || '-'}</td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400 text-sm">No excluded transactions</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function TransactionList({ restaurantId, slug }) {
  const [transactions, setTransactions] = useState([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(null)
  const [deleteReason, setDeleteReason] = useState('')

  const fetchTransactions = async () => {
    if (!restaurantId || !slug) return
    setLoading(true)
    try {
      const filters = statusFilter !== 'ALL' ? { status: statusFilter } : {}
      const data = await getAdminTransactions(restaurantId, slug, filters)
      setTransactions(data)
    } catch (err) {
      toast.error(err.message || 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTransactions() }, [restaurantId, slug, statusFilter])

  const handleDelete = async () => {
    if (!deleteReason.trim()) { toast.error('Reason is required'); return }
    try {
      await deleteTransaction(showDelete.id, deleteReason, slug)
      toast.success('Transaction deleted')
      setShowDelete(null)
      setDeleteReason('')
      fetchTransactions()
    } catch (err) {
      toast.error(err.message || 'Delete failed')
    }
  }

  const statusColor = (s) => {
    switch (s) {
      case 'SETTLED': return 'bg-green-100 text-green-800'
      case 'OPEN': return 'bg-orange-100 text-orange-800'
      case 'BILLED': return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-brand">
          <option value="ALL">All Statuses</option>
          <option value="SETTLED">Settled</option>
          <option value="OPEN">Open</option>
          <option value="BILLED">Billed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-200 rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">Bill #</th>
                <th className="text-left py-3 px-4">Table</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">{t.billNumber || t.id.slice(-6)}</td>
                  <td className="py-3 px-4">{t.tableName}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{new Date(t.createdAt).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 font-semibold">₹{Math.round(t.total).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(t.status)}`}>{t.status}</span>
                  </td>
                  <td className="py-3 px-4">
                    {(t.status === 'SETTLED' || t.status === 'OPEN') && (
                      <button onClick={() => setShowDelete(t)} className="text-red-500 hover:text-red-700 p-1">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-2">Delete Transaction?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete Bill #{showDelete.billNumber || showDelete.id.slice(-6)} for Table {showDelete.tableName} worth ₹{Math.round(showDelete.total)}? This will be logged.
            </p>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Reason for deletion (required)"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand mb-4 h-24 resize-none"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowDelete(null); setDeleteReason('') }} className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportsPage
