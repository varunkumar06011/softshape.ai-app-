import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { menuItems } from '../data/mockData'
import { getTenantSections } from '../saas/saasApi'
import { useOfflineSync } from '../hooks/useOfflineSync'
import { smartPrintKOT } from '../utils/printTemplates'
import { initDB, cacheSections, getSectionsFromCache } from '../lib/localCache'
import { ArrowLeft, Search, Plus, Minus, Send, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const CaptainPanel = ({ slug, restaurantId }) => {
  const { user, logout } = useAuth()
  const [view, setView] = useState('tables')
  const [selectedTable, setSelectedTable] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [tables, setTables] = useState([])
  const [tablesLoading, setTablesLoading] = useState(false)

  const { isOnline, pendingCount } = useOfflineSync(slug)
  const categories = ['All', 'Starters', 'Main Course', 'Rice', 'Breads', 'Bar']

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
    if (!acc[table.section]) {
      acc[table.section] = []
    }
    acc[table.section].push(table)
    return acc
  }, {})

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
        if (newQty <= 0) {
          return prev.filter(i => i.id !== item.id)
        }
        return prev.map(i => i.id === item.id ? { ...i, qty: newQty } : i)
      }
      if (delta > 0) {
        return [...prev, { ...item, qty: 1 }]
      }
      return prev
    })
  }

  const getItemQty = (itemId) => {
    const item = selectedItems.find(i => i.id === itemId)
    return item ? item.qty : 0
  }

  const handleSendKOT = () => {
    if (selectedItems.length === 0) {
      toast.error('Please select items first')
      return
    }

    const foodItems = selectedItems.filter(i => i.type !== 'bar')
    const barItems = selectedItems.filter(i => i.type === 'bar')

    let message = 'KOT Preview:\n'
    if (foodItems.length > 0) {
      message += '\nSending to Kitchen:\n'
      foodItems.forEach(i => message += `  ${i.name} x ${i.qty}\n`)
    }
    if (barItems.length > 0) {
      message += '\nSending to Bar:\n'
      barItems.forEach(i => message += `  ${i.name} x ${i.qty}\n`)
    }

    if (confirm(message + '\n\nSend KOT?')) {
      smartPrintKOT({
        kotNumber: 'K-' + Date.now().toString().slice(-6),
        table: selectedTable?.label || '-',
        section: selectedTable?.section || '-',
        captain: user?.name || '-',
        items: selectedItems.map(i => ({ name: i.name, qty: i.qty })),
        createdAt: new Date().toISOString(),
        restaurantName: 'VGrand Restaurant'
      })
      toast.success('KOT sent successfully!')
      setSelectedItems([])
      setView('tables')
      setSelectedTable(null)
    }
  }

  const handleRequestBill = () => {
    toast.success('Bill requested')
  }

  const total = selectedItems.reduce((sum, item) => sum + (item.price * item.qty), 0)

  return (
    <div className="min-h-screen bg-gray-100 max-w-md mx-auto">
      <div className="bg-brand text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-75">Captain</p>
            <p className="font-semibold">{user?.name}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 bg-brand-dark rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm mt-2 opacity-75">VGrand Restaurant</p>
        {!isOnline && (
          <p className="text-xs mt-1 text-red-200">Offline — {pendingCount} pending sync</p>
        )}
      </div>

      {view === 'tables' ? (
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Select Table</h2>
          {tablesLoading ? (
            <p className="text-gray-500">Loading tables...</p>
          ) : tables.length === 0 ? (
            <p className="text-gray-500">No tables configured</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTables).map(([section, sectionTables]) => (
                <div key={section}>
                  <h3 className="font-semibold mb-3">{section}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {sectionTables.map((table) => (
                      <div
                        key={table.id}
                        onClick={() => {
                          if (table.status === 'free') {
                            setSelectedTable(table)
                            setView('order')
                          } else {
                            toast.error('Table is occupied')
                          }
                        }}
                        className={`p-4 rounded-2xl text-center cursor-pointer transition-all ${
                          table.status === 'free'
                            ? 'bg-white border-2 border-green-400'
                            : 'bg-brand text-white'
                        }`}
                      >
                        <p className="font-bold text-lg">{table.label}</p>
                        <p className="text-sm opacity-75 capitalize">{table.status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => {
                setView('tables')
                setSelectedTable(null)
                setSelectedItems([])
              }}
              className="p-2 bg-white rounded-lg shadow"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold">{selectedTable?.label}</h2>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
            />
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-brand text-white'
                    : 'bg-white text-gray-700'
                }`}
              >
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
                    <button
                      onClick={() => handleItemQtyChange(item, -1)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-semibold">{getItemQty(item.id)}</span>
                    <button
                      onClick={() => handleItemQtyChange(item, 1)}
                      className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full mt-2 ${
                  item.type === 'veg' ? 'bg-green-500' : item.type === 'bar' ? 'bg-purple-500' : 'bg-red-500'
                }`} />
              </div>
            ))}
          </div>

          {selectedItems.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">
                  Items selected: {selectedItems.reduce((sum, i) => sum + i.qty, 0)}
                </p>
                <p className="font-bold text-lg">Total: ₹{total}</p>
              </div>
              <button
                onClick={handleSendKOT}
                className="w-full py-3 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <Send className="w-5 h-5" />
                Send KOT
              </button>
              <button
                onClick={handleRequestBill}
                className="w-full py-3 mt-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Request Bill
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CaptainPanel
