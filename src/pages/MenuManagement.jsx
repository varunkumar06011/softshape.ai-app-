import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, uploadMenuItemImage, getTodaysSpecials, suggestMenuItems, getTenantSections } from '../saas/saasApi'
import { Search, Plus, X, Pencil, Camera, Star, ArrowUpDown, Check, Trash2, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'ALL', label: 'All Items' },
  { key: 'SPECIALS', label: "Today's Specials" },
  { key: 'FOOD', label: 'Food (Kitchen)' },
  { key: 'LIQUOR', label: 'Liquor (Bar)' },
]

const FILTER_CHIPS = [
  { key: 'ALL', label: 'All' },
  { key: 'VEG', label: 'Veg' },
  { key: 'NONVEG', label: 'Non-veg' },
  { key: 'BAR', label: 'Bar' },
  { key: 'AVAILABLE', label: 'Available' },
  { key: 'UNAVAILABLE', label: 'Unavailable' },
]

const SORT_OPTIONS = [
  { key: 'name', label: 'Name A-Z' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
  { key: 'recent', label: 'Recently Added' },
]

function getOwner() {
  try { return JSON.parse(localStorage.getItem('saas_owner') || 'null') } catch { return null }
}

export default function MenuManagement() {
  const owner = getOwner()
  const restaurantId = owner?.restaurantId || owner?.slug || ''

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterChip, setFilterChip] = useState('ALL')
  const [sortKey, setSortKey] = useState('name')

  const [showAddPanel, setShowAddPanel] = useState(false)
  const [showEditPanel, setShowEditPanel] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [showImageModal, setShowImageModal] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [inlinePriceId, setInlinePriceId] = useState(null)
  const [inlinePriceValue, setInlinePriceValue] = useState('')
  const [savedFlash, setSavedFlash] = useState(null)

  const fileInputRef = useRef(null)

  const [sections, setSections] = useState([])

  useEffect(() => {
    if (!restaurantId) return
    getTenantSections(restaurantId).then(data => {
      const sectionNames = (data?.sections || []).map(s => s.name)
      setSections(sectionNames)
      localStorage.setItem('softshape_sections', JSON.stringify(sectionNames))
    }).catch(() => {
      const cached = localStorage.getItem('softshape_sections')
      if (cached) { try { setSections(JSON.parse(cached)) } catch {} }
    })
  }, [restaurantId])

  const fetchItems = async () => {
    if (!restaurantId) return
    setLoading(true)
    try {
      let data
      if (activeTab === 'SPECIALS') {
        data = await getTodaysSpecials(restaurantId)
        setItems(data || [])
      } else {
        const type = activeTab === 'ALL' ? 'BOTH' : activeTab
        const res = await getMenuItems(restaurantId, type)
        const flat = Object.values(res.categories || {}).flat()
        setItems(flat || [])
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load menu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [restaurantId, activeTab])

  const allCategories = Array.from(new Set(items.map(i => i.category))).sort()

  const filteredItems = (() => {
    let list = [...items]
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      list = list.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
    }
    if (filterChip === 'VEG') list = list.filter(i => i.isVeg)
    if (filterChip === 'NONVEG') list = list.filter(i => !i.isVeg)
    if (filterChip === 'BAR') list = list.filter(i => i.station === 'BAR' || i.menuType === 'LIQUOR')
    if (filterChip === 'AVAILABLE') list = list.filter(i => i.isActive !== false)
    if (filterChip === 'UNAVAILABLE') list = list.filter(i => i.isActive === false)

    if (sortKey === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
    if (sortKey === 'price_asc') list.sort((a, b) => a.price - b.price)
    if (sortKey === 'price_desc') list.sort((a, b) => b.price - a.price)
    if (sortKey === 'recent') list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))

    return list
  })()

  const handleToggleAvailable = async (item) => {
    try {
      await updateMenuItem(item.id, { isActive: !item.isActive })
      toast.success(item.isActive ? 'Marked unavailable' : 'Marked available')
      fetchItems()
    } catch (err) {
      toast.error(err.message || 'Update failed')
    }
  }

  const handleToggleSpecial = async (item) => {
    try {
      await updateMenuItem(item.id, { isSpecial: !item.isSpecial })
      toast.success(item.isSpecial ? 'Removed from specials' : 'Added to specials')
      fetchItems()
    } catch (err) {
      toast.error(err.message || 'Update failed')
    }
  }

  const handlePriceBlur = async (item) => {
    const val = Number(inlinePriceValue)
    if (!isNaN(val) && val !== item.price) {
      try {
        await updateMenuItem(item.id, { price: val })
        setSavedFlash(item.id)
        setTimeout(() => setSavedFlash(null), 1500)
        fetchItems()
      } catch (err) {
        toast.error(err.message || 'Price update failed')
      }
    }
    setInlinePriceId(null)
  }

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"? This will soft-delete it.`)) return
    try {
      await deleteMenuItem(item.id)
      toast.success('Item deleted')
      fetchItems()
      setShowEditPanel(false)
    } catch (err) {
      toast.error(err.message || 'Delete failed')
    }
  }

  const handleImageSelect = async (file, itemId) => {
    if (!file) return
    setUploadingImage(true)
    try {
      const { imageUrl } = await uploadMenuItemImage(file)
      await updateMenuItem(itemId, { imageUrl })
      toast.success('Image uploaded')
      setShowImageModal(null)
      setImagePreview(null)
      fetchItems()
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploadingImage(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-4 pt-16 lg:pt-8 lg:p-8 lg:ml-64">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <button onClick={() => setShowAddPanel(true)} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === t.key ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Search menu items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand" />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {FILTER_CHIPS.map(c => (
              <button key={c.key} onClick={() => setFilterChip(c.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterChip === c.key ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {c.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1 text-sm text-gray-500">
              <ArrowUpDown className="w-3 h-3" />
              <select value={sortKey} onChange={e => setSortKey(e.target.value)} className="bg-transparent focus:outline-none cursor-pointer">
                {SORT_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {activeTab === 'SPECIALS' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-sm text-yellow-800">
            Customers will see these highlighted on the ordering screen.
          </div>
        )}

        {/* Items Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Image Header */}
                <div className="relative h-36 bg-gray-100">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-black text-brand/20">{item.name.charAt(0)}</div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`block w-3 h-3 rounded-full border-2 border-white ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                  {item.isSpecial && (
                    <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Today's Special
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg leading-tight">{item.name}</h3>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.station === 'BAR' ? 'bg-purple-100 text-purple-700' : item.station === 'BOTH' ? 'bg-gray-100 text-gray-700' : 'bg-orange-100 text-orange-700'}`}>
                      {item.station === 'KITCHEN' ? 'Kitchen' : item.station === 'BAR' ? 'Bar' : 'Both'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    {inlinePriceId === item.id ? (
                      <input autoFocus type="number" value={inlinePriceValue} onChange={e => setInlinePriceValue(e.target.value)}
                        onBlur={() => handlePriceBlur(item)} onKeyDown={e => e.key === 'Enter' && handlePriceBlur(item)}
                        className="w-24 px-2 py-1 border border-brand rounded-lg text-sm font-bold" />
                    ) : (
                      <button onClick={() => { setInlinePriceId(item.id); setInlinePriceValue(String(item.price)) }}
                        className="text-xl font-bold text-brand hover:underline">
                        Rs.{item.price}
                      </button>
                    )}
                    {savedFlash === item.id && <span className="text-xs text-green-600 font-medium flex items-center gap-1"><Check className="w-3 h-3" /> saved</span>}
                    {(() => {
                      try {
                        const po = item.priceOverrides ? JSON.parse(item.priceOverrides) : {}
                        return Object.keys(po).length > 0
                      } catch { return false }
                    })() && (
                      <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium" title="Different prices per section">Prices vary</span>
                    )}
                  </div>

                  {/* Toggle + Actions */}
                  <div className="flex items-center justify-between">
                    <button onClick={() => handleToggleAvailable(item)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${item.isActive !== false ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${item.isActive !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingItem(item); setShowEditPanel(true) }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setShowImageModal(item)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Photo">
                        <Camera className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleToggleSpecial(item)} className={`p-2 hover:bg-gray-100 rounded-lg ${item.isSpecial ? 'text-yellow-500' : 'text-gray-400'}`} title="Special">
                        <Star className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {item.specialNote && (
                    <p className="text-xs text-yellow-700 mt-2 italic">{item.specialNote}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-16 text-gray-400">No items found</div>
        )}
      </div>

      {/* Add / Edit Panel */}
      {(showAddPanel || showEditPanel) && (
        <ItemPanel
          isEdit={showEditPanel}
          item={editingItem}
          categories={allCategories}
          sections={sections}
          onClose={() => { setShowAddPanel(false); setShowEditPanel(false); setEditingItem(null) }}
          onSave={async (data) => {
            try {
              if (showEditPanel && editingItem) {
                await updateMenuItem(editingItem.id, data)
                toast.success('Item updated')
              } else {
                await addMenuItem(data)
                toast.success('Item added')
              }
              setShowAddPanel(false); setShowEditPanel(false); setEditingItem(null)
              fetchItems()
            } catch (err) {
              toast.error(err.message || 'Save failed')
            }
          }}
          onDelete={showEditPanel ? () => handleDelete(editingItem) : null}
        />
      )}

      {/* Image Upload Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Upload Photo</h3>
              <button onClick={() => { setShowImageModal(null); setImagePreview(null) }} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setImagePreview(URL.createObjectURL(f)); handleImageSelect(f, showImageModal.id) } }}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg mx-auto" />
              ) : (
                <div>
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click or drop image here</p>
                  <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP up to 3MB</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) { setImagePreview(URL.createObjectURL(f)); handleImageSelect(f, showImageModal.id) } }} />
            {uploadingImage && <p className="text-center text-sm text-gray-500 mt-3">Uploading...</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function ItemPanel({ isEdit, item, categories, sections, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    itemName: '', category: '', price: '', isVeg: true, menuType: 'FOOD', station: 'KITCHEN',
    variants: [], imageUrl: '', isSpecial: false, specialNote: '',
    priceOverrides: {},
  })
  const [showOverrides, setShowOverrides] = useState(false)
  const [newVariant, setNewVariant] = useState({ name: '', price: '' })

  useEffect(() => {
    if (isEdit && item) {
      setForm({
        itemName: item.name || '', category: item.category || '', price: String(item.price || ''),
        isVeg: item.isVeg !== false, menuType: item.menuType || 'FOOD', station: item.station || 'KITCHEN',
        variants: item.variants || [], imageUrl: item.imageUrl || '', isSpecial: item.isSpecial || false,
        specialNote: item.specialNote || '',
        priceOverrides: (() => { try { return JSON.parse(item.priceOverrides || '{}') } catch { return {} } })(),
      })
      setShowOverrides(!!item.priceOverrides && item.priceOverrides !== '{}')
    }
  }, [isEdit, item])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addVariant = () => {
    if (newVariant.name && newVariant.price) {
      setForm(f => ({ ...f, variants: [...f.variants, { name: newVariant.name, price: Number(newVariant.price) }] }))
      setNewVariant({ name: '', price: '' })
    }
  }

  const removeVariant = (idx) => setForm(f => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }))

  const canSave = form.itemName && form.category && form.price

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full sm:w-[28rem] bg-white h-full overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">{isEdit ? 'Edit Item' : 'Add Item'}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Item Name</label>
              <input value={form.itemName} onChange={e => set('itemName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand" />
              {!isEdit && form.itemName.length >= 3 && (
                <AISuggestButton itemName={form.itemName} onSuggest={(s) => {
                  setForm(f => ({
                    ...f, category: s.category || f.category, price: String(s.suggestedPrice || f.price),
                    isVeg: s.isVeg !== undefined ? s.isVeg : f.isVeg,
                    menuType: s.menuType || f.menuType, station: s.station || f.station,
                    specialNote: s.description || f.specialNote,
                  }))
                }} />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input list="cats" value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand" />
              <datalist id="cats">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Price (Rs)</label>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand" />
            </div>

            {/* Section Price Overrides */}
            <div>
              <button type="button" onClick={() => setShowOverrides(v => !v)}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
                <span className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${showOverrides ? 'bg-brand border-brand' : 'border-gray-300'}`}>
                  {showOverrides && <Check className="w-3 h-3 text-white" />}
                </span>
                Section Price Overrides (optional)
              </button>
              {showOverrides && (
                <div className="mt-3 space-y-2">
                  {sections.length === 0 && (
                    <p className="text-xs text-gray-400">No sections configured yet. Save base price for now.</p>
                  )}
                  {sections.map(sec => (
                    <div key={sec} className="flex items-center gap-3">
                      <span className="flex-1 text-sm text-gray-700">{sec}</span>
                      <input type="number" placeholder={form.price || 'Base'}
                        value={form.priceOverrides[sec] || ''}
                        onChange={e => {
                          const val = e.target.value
                          setForm(f => ({
                            ...f,
                            priceOverrides: { ...f.priceOverrides, [sec]: val ? Number(val) : undefined },
                          }))
                        }}
                        className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                  ))}
                  {/* Allow custom section entry if none exist */}
                  {sections.length === 0 && (
                    <div className="flex items-center gap-2">
                      <input type="text" placeholder="Section name"
                        onChange={e => {
                          const sec = e.target.value
                          if (!sec) return
                          // handled via price input below
                        }}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Veg / Non-veg</label>
              <div className="flex gap-3">
                {[{ label: 'Veg', val: true, dot: 'bg-green-500' }, { label: 'Non-Veg', val: false, dot: 'bg-red-500' }].map(opt => (
                  <button key={opt.label} onClick={() => set('isVeg', opt.val)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${form.isVeg === opt.val ? 'border-brand bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${opt.dot}`} />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Station</label>
              <div className="flex gap-2">
                {['KITCHEN', 'BAR', 'BOTH'].map(s => (
                  <button key={s} onClick={() => set('station', s)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${form.station === s ? 'bg-brand text-white border-brand' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {s === 'KITCHEN' ? 'Kitchen' : s === 'BAR' ? 'Bar' : 'Both'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Menu Type</label>
              <div className="flex gap-2">
                {['FOOD', 'LIQUOR', 'BOTH'].map(m => (
                  <button key={m} onClick={() => set('menuType', m)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${form.menuType === m ? 'bg-brand text-white border-brand' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {m === 'FOOD' ? 'Food' : m === 'LIQUOR' ? 'Liquor' : 'Both'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Variants (optional)</label>
              <div className="space-y-2">
                {form.variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="flex-1 text-sm">{v.name} - Rs.{v.price}</span>
                    <button onClick={() => removeVariant(i)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input placeholder="Variant name (e.g. Half)" value={newVariant.name} onChange={e => setNewVariant(p => ({ ...p, name: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <input type="number" placeholder="Price" value={newVariant.price} onChange={e => setNewVariant(p => ({ ...p, price: e.target.value }))}
                    className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <button onClick={addVariant} className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200">Add</button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Special Note (optional)</label>
              <input placeholder="e.g. Chef's pick today" value={form.specialNote} onChange={e => set('specialNote', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand" />
            </div>

            <div className="flex items-center gap-3 bg-yellow-50 rounded-xl p-3">
              <input id="special" type="checkbox" checked={form.isSpecial} onChange={e => set('isSpecial', e.target.checked)}
                className="w-4 h-4 accent-brand" />
              <label htmlFor="special" className="text-sm font-medium text-yellow-800 cursor-pointer">
                Mark as Today's Special
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input id="imageUrl" placeholder="Image URL (optional)" value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand text-sm" />
            </div>

            <button onClick={() => {
              const data = { ...form }
              if (Object.keys(data.priceOverrides || {}).length > 0) {
                const cleaned = {}
                for (const [k, v] of Object.entries(data.priceOverrides)) {
                  if (v !== undefined && v !== null && v !== '') cleaned[k] = Number(v)
                }
                data.priceOverrides = Object.keys(cleaned).length > 0 ? cleaned : undefined
              }
              onSave(data)
            }} disabled={!canSave}
              className={`w-full py-3 rounded-xl font-semibold transition-colors ${canSave ? 'bg-brand text-white hover:bg-brand-dark' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              {isEdit ? 'Save Changes' : 'Add Item'}
            </button>

            {isEdit && onDelete && (
              <button onClick={onDelete} className="w-full py-3 border border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete Item
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AISuggestButton({ itemName, onSuggest }) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const { suggestions } = await suggestMenuItems([itemName])
      if (suggestions && suggestions[0]) {
        onSuggest(suggestions[0])
        toast.success('AI suggested fields — review before saving')
      }
    } catch (err) {
      toast.error(err.message || 'AI suggestion failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleClick} disabled={loading}
      className="mt-2 flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors">
      <Sparkles className="w-3.5 h-3.5" />
      {loading ? 'Thinking...' : 'AI fill from name'}
    </button>
  )
}
