import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { searchOrders, refundOrder, reopenOrder } from '../saas/saasApi'
import { getStationPermissions } from '../saas/saasApi'
import { Search, FileText, RotateCcw, X, Printer } from 'lucide-react'
import { smartPrintBill } from '../utils/printTemplates'
import toast from 'react-hot-toast'

export default function BillFinder() {
  const { slug: urlSlug } = useParams()
  const [filters, setFilters] = useState({ billNo: '', mobileNo: '', date: '', tableId: '', amount: '', cashier: '' })
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [viewOrder, setViewOrder] = useState(null)
  const [refundTarget, setRefundTarget] = useState(null)
  const [refundReason, setRefundReason] = useState('')
  const perms = getStationPermissions()

  const session = (() => {
    try {
      const s = localStorage.getItem(`tenant_${urlSlug}_session`) || localStorage.getItem('saas_owner')
      return s ? JSON.parse(s) : null
    } catch { return null }
  })()
  const restaurantId = session?.restaurantId || session?.slug || ''
  const slug = urlSlug || session?.slug || ''

  const handleSearch = async () => {
    if (!restaurantId || !slug) return
    setLoading(true)
    try {
      const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
      const data = await searchOrders(restaurantId, activeFilters, slug)
      setResults(data)
    } catch (err) {
      toast.error(err.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { handleSearch() }, [restaurantId, slug])

  const handleRefund = async () => {
    if (!refundReason.trim()) { toast.error('Reason is required'); return }
    try {
      await refundOrder(refundTarget.id, { refundReason, performedBy: '', performedByUsername: '' }, slug)
      toast.success('Order refunded')
      setRefundTarget(null)
      setRefundReason('')
      handleSearch()
    } catch (err) {
      toast.error(err.message || 'Refund failed')
    }
  }

  const handleReopen = async (orderId) => {
    try {
      await reopenOrder(orderId, { performedBy: '', performedByUsername: '' }, slug)
      toast.success('Bill reopened')
      handleSearch()
    } catch (err) {
      toast.error(err.message || 'Reopen failed')
    }
  }

  const handleReprint = (order) => {
    try {
      smartPrintBill({
        billNumber: order.billNumber || `BILL-${Date.now().toString().slice(-6)}`,
        table: order.tableName,
        section: order.section,
        items: order.items,
        subtotal: order.subtotal,
        cgst: order.cgst,
        sgst: order.sgst,
        total: order.total,
        createdAt: new Date(order.createdAt),
        restaurantName: '',
      })
      toast.success('Reprint sent')
    } catch (err) {
      toast.error('Print failed')
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-4 pt-16 lg:pt-8 lg:p-8 lg:ml-64">
        <h1 className="text-2xl font-bold mb-6">Bill Finder</h1>

        <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Bill No</label>
              <input type="text" value={filters.billNo} onChange={(e) => setFilters({ ...filters, billNo: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand" placeholder="e.g. BILL-123456" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Date</label>
              <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Table</label>
              <input type="text" value={filters.tableId} onChange={(e) => setFilters({ ...filters, tableId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand" placeholder="Table ID" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Amount</label>
              <input type="number" value={filters.amount} onChange={(e) => setFilters({ ...filters, amount: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand" placeholder="Exact amount" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Cashier / Station</label>
              <input type="text" value={filters.cashier} onChange={(e) => setFilters({ ...filters, cashier: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand" placeholder="Cashier name" />
            </div>
            <div className="flex items-end">
              <button onClick={handleSearch} className="w-full py-2.5 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 text-sm font-semibold">
                <Search className="w-4 h-4" /> Search
              </button>
            </div>
          </div>
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
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">{order.billNumber || order.id.slice(-6)}</td>
                    <td className="py-3 px-4">{order.tableName}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-semibold">₹{Math.round(order.total).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'SETTLED' ? 'bg-green-100 text-green-800' : order.status === 'BILLED' ? 'bg-yellow-100 text-yellow-800' : order.status === 'OPEN' ? 'bg-orange-100 text-orange-800' : order.status === 'REFUNDED' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>{order.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => setViewOrder(order)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="View"><FileText className="w-4 h-4 text-gray-500" /></button>
                        <button onClick={() => handleReprint(order)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Reprint"><Printer className="w-4 h-4 text-gray-500" /></button>
                        {order.status === 'SETTLED' && (
                          <button onClick={() => setRefundTarget(order)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Refund"><RotateCcw className="w-4 h-4 text-red-500" /></button>
                        )}
                        {(order.status === 'BILLED' || order.status === 'SETTLED') && perms.canReopen && (
                          <button onClick={() => handleReopen(order.id)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Reopen"><RotateCcw className="w-4 h-4 text-gray-500" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400 text-sm">No results</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* View Order Modal */}
        {viewOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setViewOrder(null)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Order Details</h3>
                <button onClick={() => setViewOrder(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <p><span className="text-gray-500">Bill #:</span> {viewOrder.billNumber || viewOrder.id.slice(-6)}</p>
                <p><span className="text-gray-500">Table:</span> {viewOrder.tableName}</p>
                <p><span className="text-gray-500">Status:</span> {viewOrder.status}</p>
                <p><span className="text-gray-500">Date:</span> {new Date(viewOrder.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <div className="border-t border-gray-200 pt-3 space-y-2 max-h-64 overflow-y-auto">
                {viewOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.name} x{item.qty}</span>
                    <span className="font-medium">₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between font-bold">
                <span>Total</span>
                <span>₹{Math.round(viewOrder.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Refund Modal */}
        {refundTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setRefundTarget(null)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-2">Refund Order?</h3>
              <p className="text-sm text-gray-500 mb-4">Bill #{refundTarget.billNumber || refundTarget.id.slice(-6)} — ₹{Math.round(refundTarget.total)}</p>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Reason for refund"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand mb-4 h-24 resize-none text-sm"
              />
              <div className="flex gap-3">
                <button onClick={() => { setRefundTarget(null); setRefundReason('') }} className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold">Cancel</button>
                <button onClick={handleRefund} disabled={!refundReason.trim()} className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-semibold disabled:opacity-50">Refund</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
