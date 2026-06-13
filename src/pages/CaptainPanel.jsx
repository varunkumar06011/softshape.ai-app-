import { useState, useEffect } from 'react'
import { tables } from '../data/mockData'
import { createOrder, getActiveOrders } from '../saas/saasApi'
import { ArrowLeft, Search, Plus, Minus, Send, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const CaptainPanel = ({ restaurantId, stationId, menuFilter = 'FOOD', onLogout }) => {
  const slug = (() => { try { const s = localStorage.getItem('saas_owner'); return s ? JSON.parse(s).slug : ''; } catch { return '' } })()
  const [view, setView] = useState('tables')
  const [selectedTable, setSelectedTable] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [menuItems, setMenuItems] = useState([])
  const [activeOrders, setActiveOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const groupedTables = tables.reduce((acc, table) => {
    if (!acc[table.section]) acc[table.section] = []
    acc[table.section].push(table)
    return acc
  }, {})

  const tableOrderMap = Object.fromEntries(activeOrders.map(o => [o.tableId, o]))

  useEffect(() => {
    if (!restaurantId || !slug) return
    Promise.all([
      getActiveOrders(restaurantId, slug),
      fetch(`http://localhost:4000/api/menu/${restaurantId}?type=${menuFilter}`).then(r => r.json()),
    ]).then(([orders, menu]) => {
      setActiveOrders(orders || [])
      const allItems = Object.values(menu.categories || {}).flat()
      setMenuItems(allItems)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [restaurantId, slug])

  const categories = ['All', ...Array.from(new Set(menuItems.map(i => i.category)))]

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleItemQtyChange = (item, delta) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        const newQty = existing.qty + delta
        if (newQty <= 0) return prev.filter(i => i.id !== item.id)
        return prev.map(i => i.id === item.id ? { ...i, qty: newQty } : i)
      }
      if (delta > 0) return [...prev, { ...item, qty: 1 }]
      return prev
    })
  }

  const getItemQty = (itemId) => selectedItems.find(i => i.id === itemId)?.qty || 0

  const handleSendKOT = async () => {
    if (selectedItems.length === 0) { toast.error('Please select items first'); return }
    if (!selectedTable || !restaurantId) return

    const items = selectedItems.map(i => ({
      menuItemId: i.id, name: i.name, category: i.category || '',
      price: i.price, qty: i.qty, menuType: i.menuType || 'FOOD', isVeg: i.isVeg !== false,
    }))

    try {
      await createOrder({
        restaurantId, tableId: selectedTable.id, tableName: selectedTable.label,
        section: selectedTable.section || '', items, source: 'DINE_IN',
      }, slug)
      toast.success('KOT sent successfully!')
      setSelectedItems([])
      setView('tables')
      setSelectedTable(null)
      const orders = await getActiveOrders(restaurantId, slug)
      setActiveOrders(orders || [])
    } catch (err) {
      toast.error(err.message || 'Failed to send KOT')
    }
  }

  const handleRequestBill = () => {
    toast.success('Bill requested')
  }

  const total = selectedItems.reduce((sum, item) => sum + (item.price * item.qty), 0)

  const tableStatus = (tableId) => {
    const o = tableOrderMap[tableId]
    if (!o) return 'free'
    if (o.status === 'BILLED') return 'billed'
    return 'occupied'
  }

  return (
    <div className="min-h-screen bg-gray-100 max-w-md mx-auto">
      <div className="bg-brand text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-75">Captain</p>
            <p className="font-semibold">Captain</p>
          </div>
          <button onClick={onLogout} className="p-2 bg-brand-dark rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm mt-2 opacity-75">Restaurant</p>
      </div>

      {loading && (
        <div className="p-4 animate-pulse space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
        </div>
      )}

      {view === 'tables' && !loading && (
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Select Table</h2>
          <div className="space-y-6">
            {Object.entries(groupedTables).map(([section, sectionTables]) => (
              <div key={section}>
                <h3 className="font-semibold mb-3">{section}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {sectionTables.map((table) => {
                    const status = tableStatus(table.id)
                    const statusClass = status === 'free' ? 'bg-white border-2 border-green-400'
                      : status === 'billed' ? 'bg-red-50 border-2 border-red-400'
                      : 'bg-brand text-white'
                    return (
                      <div key={table.id}
                        onClick={() => {
                          setSelectedTable(table)
                          setView('order')
                          setSelectedItems([])
                        }}
                        className={`p-4 rounded-2xl text-center cursor-pointer transition-all ${statusClass}`}
                      >
                        <p className="font-bold text-lg">{table.label}</p>
                        <p className="text-sm opacity-75 capitalize">{status}</p>
                        {tableOrderMap[table.id] && (
                          <p className="text-xs mt-1">₹{Math.round(tableOrderMap[table.id].total)}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'order' && !loading && (
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => { setView('tables'); setSelectedTable(null); setSelectedItems([]) }}
              className="p-2 bg-white rounded-lg shadow">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold">{selectedTable?.label}</h2>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand" />
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button key={category} onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${selectedCategory === category ? 'bg-brand text-white' : 'bg-white text-gray-700'}`}>
                {category}
              </button>
            ))}
          </div>

          <div className="space-y-2 mb-24">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.category}</p>
                    <p className="font-bold text-brand mt-1">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleItemQtyChange(item, -1)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-semibold">{getItemQty(item.id)}</span>
                    <button onClick={() => handleItemQtyChange(item, 1)} className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full mt-2 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
            ))}
          </div>

          {selectedItems.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">Items: {selectedItems.reduce((sum, i) => sum + i.qty, 0)}</p>
                <p className="font-bold text-lg">Total: ₹{total}</p>
              </div>
              <button onClick={handleSendKOT}
                className="w-full py-3 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 font-semibold">
                <Send className="w-5 h-5" /> Send KOT
              </button>
              <button onClick={handleRequestBill}
                className="w-full py-3 mt-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <FileText className="w-5 h-5" /> Request Bill
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CaptainPanel
