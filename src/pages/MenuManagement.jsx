import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Badge from '../components/Badge'
import { menuItems } from '../data/mockData'
import { Search, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

const MenuManagement = () => {
  const [items, setItems] = useState(menuItems)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', category: 'Main Course', type: 'veg', price: '', available: true })

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleAvailable = (id) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, available: !item.available } : item
    ))
    toast.success('Item availability updated')
  }

  const handleAddItem = () => {
    if (newItem.name && newItem.price) {
      setItems([...items, { ...newItem, id: `m${items.length + 1}`, price: parseInt(newItem.price) }])
      setNewItem({ name: '', category: 'Main Course', type: 'veg', price: '', available: true })
      setShowAddPanel(false)
      toast.success('Menu item added')
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <button
            onClick={() => setShowAddPanel(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <Badge variant={item.type} className="mt-1">{item.type}</Badge>
                </div>
                <span className={`w-3 h-3 rounded-full ${item.type === 'veg' ? 'bg-green-500' : item.type === 'bar' ? 'bg-purple-500' : 'bg-red-500'}`} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold">₹{item.price}</p>
                <button
                  onClick={() => handleToggleAvailable(item.id)}
                  className={`w-12 h-6 rounded-full transition-colors ${item.available ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${item.available ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">{item.available ? 'Available' : 'Unavailable'}</p>
            </div>
          ))}
        </div>

        {showAddPanel && (
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl p-6 z-50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Add Menu Item</h2>
              <button onClick={() => setShowAddPanel(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
                >
                  <option>Main Course</option>
                  <option>Starters</option>
                  <option>Rice</option>
                  <option>Breads</option>
                  <option>Bar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newItem.type}
                  onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
                >
                  <option value="veg">Veg</option>
                  <option value="nonveg">Non-Veg</option>
                  <option value="bar">Bar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
                />
              </div>
              <button
                onClick={handleAddItem}
                className="w-full py-3 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors font-semibold"
              >
                Add Item
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MenuManagement
