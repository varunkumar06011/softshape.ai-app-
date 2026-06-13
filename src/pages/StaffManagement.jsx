import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Badge from '../components/Badge'
import { users } from '../data/mockData'
import { Plus, X, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const StaffManagement = () => {
  const [staff, setStaff] = useState(users)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'cashier1' })

  const handleAddStaff = () => {
    if (newStaff.name && newStaff.email && newStaff.password) {
      setStaff([...staff, { ...newStaff, id: `u${staff.length + 1}`, restaurantId: 'r1' }])
      setNewStaff({ name: '', email: '', password: '', role: 'cashier1' })
      setShowAddModal(false)
      toast.success('Staff member added')
    }
  }

  const handleDeactivate = (id) => {
    setStaff(staff.map(s => s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s))
    toast.success('Staff status updated')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-4 pt-16 lg:pt-8 lg:p-8 lg:ml-64">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Staff
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-4 px-6 font-semibold">Name</th>
                <th className="text-left py-4 px-6 font-semibold">Role</th>
                <th className="text-left py-4 px-6 font-semibold">Email</th>
                <th className="text-left py-4 px-6 font-semibold">Status</th>
                <th className="text-left py-4 px-6 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id} className="border-b border-gray-100">
                  <td className="py-4 px-6 font-medium">{member.name}</td>
                  <td className="py-4 px-6">
                    <Badge variant="default">{member.role}</Badge>
                  </td>
                  <td className="py-4 px-6 text-gray-600">{member.email}</td>
                  <td className="py-4 px-6">
                    <Badge variant="success">Active</Badge>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeactivate(member.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Add Staff Member</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
                  >
                    <option value="cashier1">Cashier Dine-In</option>
                    <option value="cashier2">Cashier Delivery</option>
                    <option value="captain">Captain</option>
                  </select>
                </div>
                <button
                  onClick={handleAddStaff}
                  className="w-full py-3 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors font-semibold"
                >
                  Add Staff Member
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StaffManagement
