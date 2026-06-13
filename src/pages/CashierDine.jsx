import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import BillModal from '../components/BillModal'
import { tables } from '../data/mockData'
import { getActiveOrders, createOrder, addItemsToOrder, sendKOT, printBillAPI, duplicateOrder, settleOrder } from '../saas/saasApi'
import { printKOT, printBill } from '../utils/printTemplates'
import { Plus, Printer, FileText, X, Search, RotateCcw, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

const CashierDine = ({ restaurantId, stationId, menuFilter = 'FOOD', onLogout }) => {
  const slug = (() => { try { const s = localStorage.getItem('saas_owner'); return s ? JSON.parse(s).slug : ''; } catch { return '' } })()
  const [selectedTable, setSelectedTable] = useState(null)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showBillModal, setShowBillModal] = useState(false)
  const [activeOrders, setActiveOrders] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  const groupedTables = tables.reduce((acc, table) => {
    if (!acc[table.section]) acc[table.section] = []
    acc[table.section].push(table)
    return acc
  }, {})

  const tableOrderMap = Object.fromEntries(activeOrders.map(o => [o.tableId, o]))

  const fetchData = async () => {
    if (!restaurantId || !slug) return
    try {
      const [orders, menu] = await Promise.all([
        getActiveOrders(restaurantId, slug),
        fetch(`http://localhost:4000/api/menu/${restaurantId}?type=${menuFilter}`).then(r => r.json()),
      ])
      setActiveOrders(orders || [])
      const allItems = Object.values(menu.categories || {}).flat()
      setMenuItems(allItems)
    } catch (err) {
      toast.error(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [restaurantId, slug])

  const currentOrder = selectedTable ? tableOrderMap[selectedTable.id] : null
  const orderItems = currentOrder?.items || []
  const total = orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0)

  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddItem = async (item) => {
    if (!selectedTable || !restaurantId) return
    try {
      const orderItem = {
        menuItemId: item.id, name: item.name, category: item.category || '',
        price: item.price, qty: 1, menuType: item.menuType || 'FOOD',
        isVeg: item.isVeg !== false,
      }
      if (currentOrder) {
        await addItemsToOrder(currentOrder.id, [orderItem], slug)
        toast.success('Item added')
      } else {
        await createOrder({
          restaurantId, tableId: selectedTable.id, tableName: selectedTable.label,
          section: selectedTable.section || '', items: [orderItem], source: 'DINE_IN',
        }, slug)
        toast.success('Order created')
      }
      fetchData()
      setShowAddItem(false)
    } catch (err) {
      toast.error(err.message || 'Failed to add item')
    }
  }

  const handleKOTPrint = async () => {
    if (!currentOrder) return
    const unsent = currentOrder.items.filter(i => !i.kotSent)
    if (unsent.length === 0) { toast.error('All items already sent'); return }
    try {
      await sendKOT(currentOrder.id, unsent.map(i => i.id), slug)
      printKOT({
        kotNumber: `KOT-${Date.now()}`, table: currentOrder.tableName,
        section: currentOrder.section, captain: currentOrder.captainName,
        items: unsent, createdAt: new Date(), restaurantName: 'Restaurant',
      })
      toast.success('KOT printed')
      fetchData()
    } catch (err) {
      toast.error(err.message || 'KOT failed')
    }
  }

  const handlePrintBill = async () => {
    if (!currentOrder) return
    try {
      const updated = await printBillAPI(currentOrder.id, slug)
      printBill({
        billNumber: updated.billNumber, table: updated.tableName, section: updated.section,
        items: updated.items, subtotal: updated.subtotal, cgst: updated.cgst,
        sgst: updated.sgst, total: updated.total, restaurantName: 'Restaurant',
        createdAt: updated.billPrintedAt,
      })
      toast.success('Bill printed')
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Bill print failed')
    }
  }

  const handleDuplicate = async () => {
    if (!currentOrder) return
    try {
      await duplicateOrder(currentOrder.id, slug)
      toast.success('New order opened for table')
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Duplicate failed')
    }
  }

  const handleSettle = async (paymentMode) => {
    if (!currentOrder) return
    try {
      await settleOrder(currentOrder.id, paymentMode, slug)
      toast.success('Payment settled')
      setShowBillModal(false)
      setSelectedTable(null)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Settle failed')
    }
  }

  const tableStatus = (tableId) => {
    const o = tableOrderMap[tableId]
    if (!o) return 'free'
    if (o.status === 'BILLED') return 'billed'
    return 'occupied'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar restaurantName="Restaurant" onLogout={onLogout} />

      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-73px)]">
        <div className="w-full lg:w-3/5 p-4 lg:p-6 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 lg:mb-6">Tables</h2>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTables).map(([section, sectionTables]) => (
                <div key={section}>
                  <h3 className="font-semibold mb-3">{section}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
                    {sectionTables.map((table) => {
                      const status = tableStatus(table.id)
                      const statusClass = status === 'free' ? 'bg-green-50 border-green-300 text-green-700'
                        : status === 'billed' ? 'bg-red-50 border-red-300 text-red-700'
                        : 'bg-orange-50 border-orange-300 text-orange-700'
                      return (
                        <button
                          key={table.id}
                          onClick={() => setSelectedTable(table)}
                          className={`p-4 rounded-2xl border-2 text-center transition-all hover:shadow-md ${statusClass} ${selectedTable?.id === table.id ? 'ring-2 ring-brand' : ''}`}
                        >
                          <p className="font-bold text-lg">{table.label}</p>
                          <p className="text-xs capitalize mt-1">{status}</p>
                          {tableOrderMap[table.id] && (
                            <p className="text-xs mt-1">₹{Math.round(tableOrderMap[table.id].total)}</p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full lg:w-2/5 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-4 lg:p-6">
          {selectedTable ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{selectedTable.label}</h2>
                <button onClick={() => setSelectedTable(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {orderItems.length > 0 ? (
                <>
                  <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto">
                    {orderItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">₹{item.price} x {item.qty}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">₹{item.price * item.qty}</p>
                          {item.kotSent && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">KOT</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>₹{Math.round(total)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button onClick={() => setShowAddItem(true)} className="w-full py-3 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> Add Item
                    </button>
                    <button onClick={handleKOTPrint} className="w-full py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                      <Printer className="w-4 h-4" /> KOT Print
                    </button>
                    {currentOrder?.status === 'BILLED' ? (
                      <>
                        <button onClick={handleDuplicate} className="w-full py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                          <RotateCcw className="w-4 h-4" /> Add More Items
                        </button>
                        <button onClick={() => setShowBillModal(true)} className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                          <CreditCard className="w-4 h-4" /> Settle Payment
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={handlePrintBill} className="w-full py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                          <FileText className="w-4 h-4" /> Print Bill
                        </button>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No items in order</p>
                  <button onClick={() => setShowAddItem(true)} className="px-6 py-3 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors">
                    Add First Item
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Select a table to view order</p>
            </div>
          )}
        </div>
      </div>

      {showAddItem && (
        <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl p-6 z-50 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Add Item</h2>
            <button onClick={() => setShowAddItem(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand" />
          </div>
          <div className="space-y-2">
            {filteredMenuItems.map((item) => (
              <button key={item.id} onClick={() => handleAddItem(item)}
                className="w-full p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left">
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
        </div>
      )}

      {showBillModal && currentOrder && (
        <BillModal order={currentOrder} onClose={() => setShowBillModal(false)} onConfirmPayment={handleSettle} />
      )}
    </div>
  )
}

export default CashierDine
