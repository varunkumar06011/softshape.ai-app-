import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { tables } from '../data/mockData'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const TableManagement = () => {
  const [tableData, setTableData] = useState(tables)

  const groupedTables = tableData.reduce((acc, table) => {
    if (!acc[table.section]) {
      acc[table.section] = []
    }
    acc[table.section].push(table)
    return acc
  }, {})

  const handleAddSection = () => {
    const sectionName = prompt('Enter section name:')
    if (sectionName) {
      toast.success('Section added')
    }
  }

  const handleAddTable = (section) => {
    const tableName = prompt(`Enter table name for ${section}:`)
    if (tableName) {
      toast.success('Table added')
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
        </div>
      </div>
    </div>
  )
}

export default TableManagement
