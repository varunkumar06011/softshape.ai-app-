import { useState } from 'react'
import TopBar from '../components/TopBar'
import TableCard from '../components/TableCard'
import BillModal from '../components/BillModal'
import { tables, menuItems } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { useSocketSim } from '../hooks/useSocketSim'
import { Plus, Printer, FileText, X, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const CashierDine = () => {
  const { user, logout } = useAuth()
  const { tableUpdates } = useSocketSim()
  const [selectedTable, setSelectedTable] = useState(null)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showBillModal, setShowBillModal] = useState(false)
  const [tableOrders, setTableOrders] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  const groupedTables = tables.reduce((acc, table) => {
    if (!acc[table.section]) {
      acc[table.section] = []
    }
    acc[table.section].push(table)
    return acc
  }, {})

  const handleAddItem = (item) => {
    if (selectedTable) {
      setTableOrders(prev => ({
        ...prev,
        [selectedTable.id]: [...(prev[selectedTable.id] || []), { ...item, qty: 1 }]
      }))
      setShowAddItem(false)
      toast.success('Item added to order')
    }
  }

  const handleKOTPrint = () => {
    toast.success('KOT sent to kitchen printer')
  }

  const handleRequestBill = () => {
    toast.success('Bill requested')
  }

  const handleConfirmPayment = (paymentMode) => {
    setShowBillModal(false)
    setSelectedTable(null)
    toast.success(`Payment confirmed via ${paymentMode}`)
  }

  const currentOrder = selectedTable ? tableOrders[selectedTable.id] || [] : []
  const total = currentOrder.reduce((sum, item) => sum + (item.price * item.qty), 0)

  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar restaurantName="VGrand Restaurant" />

      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-73px)]">
        <div className="w-full lg:w-3/5 p-4 lg:p-6 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 lg:mb-6">Tables</h2>
          <div className="space-y-6">
            {Object.entries(groupedTables).map(([section, sectionTables]) => (
              <div key={section}>
                <h3 className="font-semibold mb-3">{section}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
                  {sectionTables.map((table) => (
                    <TableCard
                      key={table.id}
                      table={table}
                      status={table.status}
                      onClick={() => setSelectedTable(table)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
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

              {currentOrder.length > 0 ? (
                <>
                  <div className="space-y-3 mb-6">
                    {currentOrder.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">₹{item.price} x {item.qty}</p>
                        </div>
                        <p className="font-semibold">₹{item.price * item.qty}</p>
                  </div>
                ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>₹{total}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => setShowAddItem(true)}
                      className="w-full py-3 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item
                    </button>
                    <button
                      onClick={handleKOTPrint}
                      className="w-full py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      KOT Print
                    </button>
                    <button
                      onClick={handleRequestBill}
                      className="w-full py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Request Bill
                    </button>
                    <button
                      onClick={() => setShowBillModal(true)}
                      className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                    >
                      Print Bill
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No items in order</p>
                  <button
                    onClick={() => setShowAddItem(true)}
                    className="px-6 py-3 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors"
                  >
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
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
            />
          </div>
          <div className="space-y-2">
            {filteredMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleAddItem(item)}
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
        </div>
      )}

      {showBillModal && selectedTable && (
        <BillModal
          order={{ items: currentOrder }}
          onClose={() => setShowBillModal(false)}
          onConfirmPayment={handleConfirmPayment}
        />
      )}
    </div>
  )
}

export default CashierDine
