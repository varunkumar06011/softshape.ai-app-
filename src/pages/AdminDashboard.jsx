import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import { revenueData, runningOrders } from '../data/mockData'
import { DollarSign, Table, ShoppingCart, FileText } from 'lucide-react'

const AdminDashboard = () => {
  const [selectedTable, setSelectedTable] = useState(null)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <StatCard icon={DollarSign} label="Today's Revenue" value="₹8,420" trend="+12%" trendUp />
          <StatCard icon={Table} label="Active Tables" value="5/8" />
          <StatCard icon={ShoppingCart} label="Orders Today" value="34" trend="+8%" trendUp />
          <StatCard icon={FileText} label="Pending KOTs" value="2" />
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold mb-4">This week's revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="dineIn" fill="#E02020" name="Dine-In" />
              <Bar dataKey="delivery" fill="#B91C1C" name="Delivery" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">Table</th>
                <th className="text-left py-3 px-4">Items</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {runningOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100">
                  <td className="py-3 px-4">{order.tableId}</td>
                  <td className="py-3 px-4">{order.items.map(i => i.name).join(', ')}</td>
                  <td className="py-3 px-4 font-semibold">
                    ₹{order.items.reduce((sum, i) => sum + (i.price * i.qty), 0)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
