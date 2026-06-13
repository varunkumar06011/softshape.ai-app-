import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import { revenueData } from '../data/mockData'
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react'

const ReportsPage = () => {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const breakdownData = [
    { channel: 'Dine-In', orders: 156, revenue: 124000, avgOrder: 795 },
    { channel: 'Swiggy', orders: 89, revenue: 45600, avgOrder: 512 },
    { channel: 'Zomato', orders: 67, revenue: 38900, avgOrder: 581 },
    { channel: 'Walk-In', orders: 34, revenue: 18900, avgOrder: 556 },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-4 pt-16 lg:pt-8 lg:p-8 lg:ml-64">
        <h1 className="text-2xl font-bold mb-6">Reports</h1>

        <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold mb-4">Date Range</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-brand"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <StatCard icon={DollarSign} label="Total Revenue" value="₹2,27,400" trend="+15%" trendUp />
          <StatCard icon={ShoppingCart} label="Dine-In Revenue" value="₹1,24,000" />
          <StatCard icon={Users} label="Delivery Revenue" value="₹84,500" />
          <StatCard icon={TrendingUp} label="Total Orders" value="346" trend="+12%" trendUp />
        </div>

        <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="dineIn" stroke="#E02020" name="Dine-In" />
              <Line type="monotone" dataKey="delivery" stroke="#B91C1C" name="Delivery" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Channel Breakdown</h2>
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">Channel</th>
                <th className="text-left py-3 px-4">Orders</th>
                <th className="text-left py-3 px-4">Revenue</th>
                <th className="text-left py-3 px-4">Avg Order Value</th>
              </tr>
            </thead>
            <tbody>
              {breakdownData.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">{row.channel}</td>
                  <td className="py-3 px-4">{row.orders}</td>
                  <td className="py-3 px-4 font-semibold">₹{row.revenue.toLocaleString()}</td>
                  <td className="py-3 px-4">₹{row.avgOrder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ReportsPage
