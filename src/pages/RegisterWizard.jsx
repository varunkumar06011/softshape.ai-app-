import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePersistentState } from '../hooks/usePersistentState'
import { Check, Plus, Upload, Instagram, Facebook } from 'lucide-react'
import { menuItems } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const defaultSections = [
  { name: 'AC', tables: ['AC-1', 'AC-2', 'AC-3'] },
  { name: 'Rooftop', tables: ['Roof-1', 'Roof-2'] },
  { name: 'Bar', tables: ['Bar-1', 'Bar-2'] }
]

const RegisterWizard = () => {
  const [step, setStep] = usePersistentState('rw_step', 1)
  const [formData, setFormData] = usePersistentState('rw_form', {
    restaurantName: '',
    city: '',
    address: '',
    gstNumber: '',
    ownerName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    menuItems: [...menuItems],
    sections: JSON.parse(JSON.stringify(defaultSections)),
    plan: 'pro',
    instagramConnected: false,
    facebookConnected: false
  })
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', category: 'Main Course', type: 'veg', price: '' })
  const navigate = useNavigate()
  const { login } = useAuth()

  const steps = [
    { name: 'Restaurant Details' },
    { name: 'Owner Account' },
    { name: 'Menu Setup' },
    { name: 'Tables & Sections' },
    { name: 'Choose Plan' }
  ]

  const handleNext = () => {
    if (step < 5) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleAddMenuItem = () => {
    if (newItem.name && newItem.price) {
      setFormData({
        ...formData,
        menuItems: [...formData.menuItems, { ...newItem, id: `m${formData.menuItems.length + 1}`, available: true, price: parseInt(newItem.price) }]
      })
      setNewItem({ name: '', category: 'Main Course', type: 'veg', price: '' })
      setShowAddItem(false)
      toast.success('Menu item added')
    }
  }

  const handleAddSection = () => {
    const sectionName = prompt('Enter section name:')
    if (sectionName) {
      setFormData({
        ...formData,
        sections: [...formData.sections, { name: sectionName, tables: [] }]
      })
    }
  }

  const handleAddTable = (sectionIndex) => {
    const tableName = prompt('Enter table name:')
    if (tableName) {
      const newSections = [...formData.sections]
      newSections[sectionIndex].tables.push(tableName)
      setFormData({ ...formData, sections: newSections })
    }
  }

  const handleComplete = () => {
    login({
      name: formData.ownerName,
      email: formData.email,
      role: 'admin',
      restaurantName: formData.restaurantName
    })
    toast.success('Setup completed successfully!')
    localStorage.removeItem('rw_step')
    localStorage.removeItem('rw_form')
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            {steps.map((s, idx) => (
              <div key={idx} className="flex items-center flex-1">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-base shrink-0 ${
                  idx + 1 < step ? 'bg-brand text-white' :
                  idx + 1 === step ? 'bg-brand text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {idx + 1 < step ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : idx + 1}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-1 sm:mx-2 ${idx + 1 < step ? 'bg-brand' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="hidden sm:flex justify-between text-sm text-gray-600">
            {steps.map((s, idx) => (
              <span key={idx} className={idx + 1 === step ? 'font-semibold text-brand' : ''}>
                {s.name}
              </span>
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-6">Restaurant Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Restaurant Name</label>
                <input
                  type="text"
                  value={formData.restaurantName}
                  onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
                  placeholder="Enter restaurant name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
                  placeholder="Enter address"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">GST Number</label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
                  placeholder="Enter GST number"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-6">Owner Account</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Owner Name</label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
                  placeholder="Enter owner name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
                  placeholder="Enter password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
                  placeholder="Confirm password"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-6">Menu Setup</h2>
            <div className="mb-4">
              <button
                onClick={() => setShowAddItem(true)}
                className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
              <button className="flex items-center gap-2 px-4 py-2 ml-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                <Upload className="w-4 h-4" />
                Upload Menu PDF
              </button>
            </div>

            {showAddItem && (
              <div className="bg-gray-50 p-4 rounded-xl mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option>Main Course</option>
                    <option>Starters</option>
                    <option>Rice</option>
                    <option>Breads</option>
                    <option>Bar</option>
                  </select>
                  <select
                    value={newItem.type}
                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="veg">Veg</option>
                    <option value="nonveg">Non-Veg</option>
                    <option value="bar">Bar</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Price"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <button onClick={handleAddMenuItem} className="px-4 py-2 bg-brand text-white rounded-lg">
                    Add
                  </button>
                  <button onClick={() => setShowAddItem(false)} className="px-4 py-2 bg-gray-200 rounded-lg">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {formData.menuItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.category} · {item.type} · ₹{item.price}</p>
                  </div>
                  <span className={`w-3 h-3 rounded-full ${item.type === 'veg' ? 'bg-green-500' : item.type === 'bar' ? 'bg-purple-500' : 'bg-red-500'}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-6">Tables & Sections</h2>
            <button
              onClick={handleAddSection}
              className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors mb-4"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </button>
            <div className="space-y-4">
              {formData.sections.map((section, sectionIdx) => (
                <div key={sectionIdx} className="border border-gray-200 rounded-xl p-4">
                  <h3 className="font-semibold mb-3">{section.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {section.tables.map((table, tableIdx) => (
                      <span key={tableIdx} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                        {table}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleAddTable(sectionIdx)}
                    className="text-sm text-brand hover:underline"
                  >
                    + Add Table
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-6">Choose Plan & Connect Social</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div
                onClick={() => setFormData({ ...formData, plan: 'basic' })}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                  formData.plan === 'basic' ? 'border-brand bg-brand-light' : 'border-gray-200'
                }`}
              >
                <h3 className="font-bold text-lg mb-2">Basic</h3>
                <p className="text-2xl font-bold mb-2">₹7,999<span className="text-sm font-normal">/year</span></p>
                <p className="text-sm text-gray-600">POS, Captain, KOT printing</p>
              </div>
              <div
                onClick={() => setFormData({ ...formData, plan: 'pro' })}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                  formData.plan === 'pro' ? 'border-brand bg-brand-light' : 'border-gray-200'
                }`}
              >
                <h3 className="font-bold text-lg mb-2">Pro</h3>
                <p className="text-2xl font-bold mb-2">₹12,999<span className="text-sm font-normal">/year</span></p>
                <p className="text-sm text-gray-600">Everything + Swiggy/Zomato + Marketing AI</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3">Connect Social Media</h3>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => setFormData({ ...formData, instagramConnected: true })}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                    formData.instagramConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Instagram className="w-5 h-5" />
                  {formData.instagramConnected ? 'Connected' : 'Connect Instagram'}
                </button>
                <button
                  onClick={() => setFormData({ ...formData, facebookConnected: true })}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                    formData.facebookConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Facebook className="w-5 h-5" />
                  {formData.facebookConnected ? 'Connected' : 'Connect Facebook'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}
          {step < 5 ? (
            <button
              onClick={handleNext}
              className="ml-auto px-6 py-3 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="ml-auto px-6 py-3 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors"
            >
              Complete Setup & Go to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default RegisterWizard
