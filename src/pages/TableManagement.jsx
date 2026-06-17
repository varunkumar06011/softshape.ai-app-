import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { getTenantSections, createTenantSection, updateTenantSection } from '../saas/saasApi'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'

function getTenantSlugFromStorage() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('tenant_') && key.endsWith('_session')) {
      const slug = key.replace('tenant_', '').replace('_session', '')
      return slug
    }
  }
  return null
}

const TableManagement = () => {
  const [sections, setSections] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(false)

  const { slug: urlSlug } = useParams()
  const tenantSlug = urlSlug || getTenantSlugFromStorage()
  const session = (() => {
    try {
      const s = localStorage.getItem(`tenant_${tenantSlug}_session`) || localStorage.getItem('saas_owner')
      return s ? JSON.parse(s) : null
    } catch { return null }
  })()
  const restaurantId = session?.restaurantId || session?.slug || ''

  const fetchData = async () => {
    if (!restaurantId) return
    setLoading(true)
    try {
      const data = await getTenantSections(restaurantId)
      setSections(data?.sections || [])
      setTables(data?.tables || [])
    } catch (err) {
      console.error('Failed to load tables:', err)
      toast.error('Failed to load floor plan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [restaurantId])

  const groupedTables = tables.reduce((acc, table) => {
    if (!acc[table.section]) acc[table.section] = []
    acc[table.section].push(table)
    return acc
  }, {})

  const handleAddSection = async () => {
    const sectionName = prompt('Enter section name:')
    if (!sectionName || !restaurantId || !tenantSlug) return
    try {
      await createTenantSection(restaurantId, tenantSlug, { name: sectionName, tableCount: 0 })
      toast.success('Section added')
      await fetchData()
    } catch (err) {
      console.error('[TableManagement] Add section failed:', err);
      toast.error(err.message || 'Failed to add section')
    }
  }

  const handleAddTable = async (sectionName) => {
    if (!restaurantId || !tenantSlug) return
    const section = sections.find(s => s.name === sectionName)
    if (!section) return
    try {
      await updateTenantSection(section.id, tenantSlug, { tableCount: section.tableCount + 1 })
      toast.success('Table added')
      await fetchData()
    } catch (err) {
      toast.error(err.message || 'Failed to add table')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'free':
        return 'bg-white border-2 border-green-400'
      case 'occupied':
        return 'bg-brand text-white'
      default:
        return 'bg-white border-2 border-gray-200'
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-4 pt-16 lg:pt-8 lg:p-8 lg:ml-64">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Table Management</h1>
          <button
            onClick={handleAddSection}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Section
          </button>
        </div>

        {loading && <div className="animate-pulse space-y-3"><div className="h-8 bg-gray-200 rounded-xl w-1/3" /><div className="h-32 bg-gray-200 rounded-xl" /></div>}

        <div className="space-y-8">
          {Object.entries(groupedTables).map(([section, sectionTables]) => (
            <div key={section}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{section}</h2>
                <button
                  onClick={() => handleAddTable(section)}
                  className="text-sm text-brand hover:underline"
                >
                  + Add Table
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
                {sectionTables.map((table) => (
                  <div
                    key={table.id}
                    className={`p-4 lg:p-6 rounded-2xl text-center ${getStatusColor(table.status)}`}
                  >
                    <p className="font-bold text-lg lg:text-xl">{table.label}</p>
                    <p className="text-sm opacity-75 mt-1 capitalize">{table.status}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!loading && tables.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>No sections yet. Click "Add Section" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TableManagement
