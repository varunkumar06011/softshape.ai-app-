import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import BillModal from '../components/BillModal'
import { getTenantSections, getActiveOrders, createOrder, addItemsToOrder, sendKOT, printBillAPI, duplicateOrder, settleOrder, swapTable, swapItems, mergeOrders } from '../saas/saasApi'
import { smartPrintKOT, smartPrintBill } from '../utils/printTemplates'
import { useSocket } from '../hooks/useSocket'
import { useOfflineSync } from '../hooks/useOfflineSync'
import { initDB } from '../lib/localCache'
import { Plus, Printer, FileText, X, Search, RotateCcw, CreditCard, ArrowLeftRight, ArrowRight, Merge } from 'lucide-react'
import toast from 'react-hot-toast'

const CashierDine = ({ restaurantId, stationId, menuFilter = 'FOOD', onLogout }) => {
  const slug = (() => { try { const s = localStorage.getItem('saas_owner'); return s ? JSON.parse(s).slug : ''; } catch { return '' } })()
  const [selectedTable, setSelectedTable] = useState(null)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showBillModal, setShowBillModal] = useState(false)
  const [showSwapTable, setShowSwapTable] = useState(false)
  const [showMoveItem, setShowMoveItem] = useState(null)
  const [showMerge, setShowMerge] = useState(false)
  const [activeOrders, setActiveOrders] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [tables, setTables] = useState([])
  const [tablesLoading, setTablesLoading] = useState(false)

  const { isOnline, pendingCount } = useOfflineSync(slug)

  useSocket(restaurantId, {
    onOrderUpdated: (order) => {
      setActiveOrders(prev => {
        const idx = prev.findIndex(o => o.id === order.id)
        if (idx >= 0) { const next = [...prev]; next[idx] = order; return next }
        return [order, ...prev]
      })
    },
    onOrderSettled: ({ orderId }) => {
      setActiveOrders(prev => prev.filter(o => o.id !== orderId))
      setSelectedTable(null)
    }
  })

  useEffect(() => {
    initDB()
  }, [])

  useEffect(() => {
    if (!restaurantId) return
    const fetchTables = async () => {
      setTablesLoading(true)
      try {
        const data = await getTenantSections(restaurantId)
        setTables(data || [])
      } catch (err) {
        console.error('Failed to load tables:', err)
        setTables([])
        toast.error('No tables configured')
      } finally {
        setTablesLoading(false)
      }
    }
    fetchTables()
  }, [restaurantId])

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
      smartPrintKOT({
        kotNumber: `KOT-${Date.now()}`, table: currentOrder.tableName,
        section: currentOrder.section, captain: currentOrder.captainName,
        items: unsent, createdAt: new Date().toISOString(), restaurantName: 'Restaurant',
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
      smartPrintBill({
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
      <TopBar restaurantName="Restaurant" onLogout={onLogout} isOnline={isOnline} pendingSync={pendingCount} />

      {!isOnline && (
        <div className="bg-red-50 text-red-700 text-xs px-6 py-1 border-b border-red-200">
          No internet — billing works offline. {pendingCount} order{pendingCount !== 1 ? 's' : ''} pending sync.
        </div>
      )}
      {isOnline && pendingCount > 0 && (
        <div className="bg-green-50 text-green-700 text-xs px-6 py-1 border-b border-green-200">
          Back online — syncing {pendingCount} order{pendingCount !== 1 ? 's' : ''}...
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-73px)]">
        <div className="w-full lg:w-3/5 p-4 lg:p-6 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 lg:mb-6">Tables</h2>
          {tablesLoading ? (
            <p className="text-gray-500">Loading tables...</p>
          ) : tables.length === 0 ? (
            <p className="text-gray-500">No tables configured</p>
          ) : loading ? (
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
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">₹{item.price} x {item.qty}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">₹{item.price * item.qty}</p>
                          {item.kotSent && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">KOT</span>}
                          <button onClick={() => setShowMoveItem(item)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity" title="Move item">
                            <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                          </button>
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
                        <button onClick={() => setShowSwapTable(true)} className="w-full py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                          <ArrowLeftRight className="w-4 h-4" /> Swap Table
                        </button>
                        <button onClick={() => setShowMerge(true)} className="w-full py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                          <Merge className="w-4 h-4" /> Merge Tables
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

      {/* Swap Table Modal */}
      {showSwapTable && currentOrder && (
        <SwapTableModal
          tables={tables}
          occupiedTableIds={Object.keys(tableOrderMap)}
          currentTable={selectedTable}
          onClose={() => setShowSwapTable(false)}
          onSwap={async (targetTable) => {
            try {
              await swapTable(currentOrder.id, targetTable.id, targetTable.label, targetTable.section || '')
              toast.success(`Order moved to ${targetTable.label}`)
              setShowSwapTable(false)
              fetchData()
              setSelectedTable(targetTable)
            } catch (err) {
              toast.error(err.message || 'Swap failed')
            }
          }}
        />
      )}

      {/* Move Item Modal */}
      {showMoveItem && currentOrder && (
        <MoveItemModal
          item={showMoveItem}
          currentOrder={currentOrder}
          activeOrders={activeOrders}
          onClose={() => setShowMoveItem(null)}
          onMove={async (targetOrderId) => {
            try {
              await swapItems(currentOrder.id, targetOrderId, [showMoveItem.id])
              toast.success('Item moved')
              setShowMoveItem(null)
              fetchData()
            } catch (err) {
              toast.error(err.message || 'Move failed')
            }
          }}
        />
      )}

      {/* Merge Modal */}
      {showMerge && currentOrder && (
        <MergeModal
          currentOrder={currentOrder}
          activeOrders={activeOrders}
          onClose={() => setShowMerge(false)}
          onMerge={async (targetOrderId) => {
            try {
              await mergeOrders(currentOrder.id, targetOrderId)
              toast.success('Tables merged')
              setShowMerge(false)
              fetchData()
              setSelectedTable(null)
            } catch (err) {
              toast.error(err.message || 'Merge failed')
            }
          }}
        />
      )}
    </div>
  )
}

function SwapTableModal({ tables, occupiedTableIds, currentTable, onClose, onSwap }) {
  const freeTables = tables.filter(t => !occupiedTableIds.includes(t.id) && t.id !== currentTable?.id)
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Move order to another table</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {freeTables.map(t => (
            <button key={t.id} onClick={() => { if (confirm(`Move ${currentTable?.label} order to ${t.label}?`)) onSwap(t) }}
              className="p-3 bg-green-50 border border-green-200 rounded-xl text-center hover:bg-green-100 transition-colors">
              <p className="font-bold text-sm">{t.label}</p>
              <p className="text-[10px] text-green-700">Free</p>
            </button>
          ))}
          {tables.filter(t => occupiedTableIds.includes(t.id)).map(t => (
            <div key={t.id} className="p-3 bg-gray-100 border border-gray-200 rounded-xl text-center opacity-50 cursor-not-allowed">
              <p className="font-bold text-sm text-gray-500">{t.label}</p>
              <p className="text-[10px] text-gray-400">Occupied</p>
            </div>
          ))}
        </div>
        {freeTables.length === 0 && <p className="text-center text-gray-500 text-sm">No free tables available</p>}
      </div>
    </div>
  )
}

function MoveItemModal({ item, currentOrder, activeOrders, onClose, onMove }) {
  const otherOrders = activeOrders.filter(o => o.id !== currentOrder.id && o.status !== 'SETTLED' && o.status !== 'CANCELLED')
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Move "{item.name}"</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-gray-500 mb-3">Select a table with a running order:</p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {otherOrders.length === 0 && <p className="text-sm text-gray-400">No other active orders</p>}
          {otherOrders.map(o => (
            <button key={o.id} onClick={() => { if (confirm(`Move "${item.name}" to ${o.tableName}?`)) onMove(o.id) }}
              className="w-full p-3 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{o.tableName}</p>
                <p className="text-xs text-gray-500">{o.items?.length || 0} items · Rs.{Math.round(o.total || 0)}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function MergeModal({ currentOrder, activeOrders, onClose, onMerge }) {
  const otherOrders = activeOrders.filter(o => o.id !== currentOrder.id && o.status !== 'SETTLED' && o.status !== 'CANCELLED')
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Merge Tables</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-gray-500 mb-3">Select table to merge into:</p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {otherOrders.length === 0 && <p className="text-sm text-gray-400">No other active orders</p>}
          {otherOrders.map(o => (
            <button key={o.id} onClick={() => { if (confirm(`Merge ${currentOrder.tableName} into ${o.tableName}? All items will move here.`)) onMerge(o.id) }}
              className="w-full p-3 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{o.tableName}</p>
                <p className="text-xs text-gray-500">{o.items?.length || 0} items · Rs.{Math.round(o.total || 0)}</p>
              </div>
              <Merge className="w-4 h-4 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CashierDine
