import { useState, useEffect } from 'react'
import { Printer, Circle } from 'lucide-react'
import { useSocketSim } from '../hooks/useSocketSim'

const PrintStation = () => {
  const { kotEvents } = useSocketSim()
  const [kitchenKOTs, setKitchenKOTs] = useState([])
  const [barKOTs, setBarKOTs] = useState([])
  const [bills, setBills] = useState([])

  useEffect(() => {
    // Simulate initial print jobs
    setKitchenKOTs([
      { id: 'kot1', table: 'AC-2', items: ['Paneer Butter Masala x2', 'Butter Naan x4'], time: '10:30 AM', status: 'PRINTED' },
      { id: 'kot2', table: 'Roof-1', items: ['Chicken Biryani x1', 'Whisky (60ml) x2'], time: '10:45 AM', status: 'PRINTED' },
    ])
    setBarKOTs([
      { id: 'bar1', table: 'AC-2', items: ['Whisky (60ml) x2', 'Kingfisher Beer x1'], time: '10:30 AM', status: 'PRINTED' },
    ])
    setBills([
      { id: 'bill1', table: 'AC-1', total: 840, time: '10:15 AM', status: 'PRINTED' },
    ])
  }, [])

  useEffect(() => {
    // Add new KOTs from socket simulation
    if (kotEvents.length > 0) {
      setKitchenKOTs(prev => [...kotEvents, ...prev].slice(0, 10))
    }
  }, [kotEvents])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Print Station</h1>
          <p className="text-gray-400">VGrand Restaurant</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Kitchen KOT Column */}
          <div className="bg-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Printer className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-bold">Kitchen KOT</h2>
              <Circle className="w-3 h-3 text-green-400 fill-green-400 ml-auto" />
            </div>
            <div className="space-y-3">
              {kitchenKOTs.map((kot) => (
                <div key={kot.id} className="bg-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Table {kot.table}</span>
                    <span className="text-sm text-gray-400">{kot.time}</span>
                  </div>
                  <div className="text-sm space-y-1 mb-2">
                    {kot.items.map((item, idx) => (
                      <div key={idx}>{item}</div>
                    ))}
                  </div>
                  <span className="px-2 py-1 bg-green-600 text-white rounded-full text-xs">
                    {kot.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar KOT Column */}
          <div className="bg-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Printer className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-bold">Bar KOT</h2>
              <Circle className="w-3 h-3 text-green-400 fill-green-400 ml-auto" />
            </div>
            <div className="space-y-3">
              {barKOTs.map((kot) => (
                <div key={kot.id} className="bg-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Table {kot.table}</span>
                    <span className="text-sm text-gray-400">{kot.time}</span>
                  </div>
                  <div className="text-sm space-y-1 mb-2">
                    {kot.items.map((item, idx) => (
                      <div key={idx}>{item}</div>
                    ))}
                  </div>
                  <span className="px-2 py-1 bg-green-600 text-white rounded-full text-xs">
                    {kot.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bill Printer Column */}
          <div className="bg-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Printer className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-bold">Bill Printer</h2>
              <Circle className="w-3 h-3 text-green-400 fill-green-400 ml-auto" />
            </div>
            <div className="space-y-3">
              {bills.map((bill) => (
                <div key={bill.id} className="bg-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Table {bill.table}</span>
                    <span className="text-sm text-gray-400">{bill.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total</span>
                    <span className="font-bold text-lg">₹{bill.total}</span>
                  </div>
                  <span className="px-2 py-1 bg-green-600 text-white rounded-full text-xs mt-2 inline-block">
                    {bill.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Printers connected and ready</p>
          <p className="mt-1">Auto-refreshing every 20 seconds</p>
        </div>
      </div>
    </div>
  )
}

export default PrintStation
