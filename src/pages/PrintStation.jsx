import { useState, useEffect } from 'react'
import { Printer, Circle } from 'lucide-react'
import { printKOT, printBill } from '../utils/printTemplates'

const PrintStation = () => {
  const [kitchenKOTs, setKitchenKOTs] = useState([])
  const [barKOTs, setBarKOTs] = useState([])
  const [bills, setBills] = useState([])

  useEffect(() => {
    setKitchenKOTs([
      { id: 'kot1', table: 'AC-2', items: [{ name: 'Paneer Butter Masala', qty: 2 }, { name: 'Butter Naan', qty: 4 }], time: '10:30 AM', status: 'PRINTED' },
    ])
    setBarKOTs([
      { id: 'bar1', table: 'AC-2', items: [{ name: 'Whisky (60ml)', qty: 2 }, { name: 'Kingfisher Beer', qty: 1 }], time: '10:30 AM', status: 'PRINTED' },
    ])
    setBills([
      { id: 'bill1', table: 'AC-1', total: 840, time: '10:15 AM', status: 'PRINTED' },
    ])
  }, [])

  const testPrintKOT = () => {
    printKOT({
      kotNumber: `TEST-${Date.now()}`, table: 'T-1', section: 'Main Hall',
      captain: 'Test Captain', items: [{ name: 'Test Item', qty: 1 }],
      createdAt: new Date(), restaurantName: 'Test Restaurant',
    })
  }

  const testPrintBill = () => {
    printBill({
      billNumber: `TEST-${Date.now()}`, table: 'T-1', section: 'Main Hall',
      items: [{ name: 'Test Item', qty: 1, price: 100 }],
      subtotal: 100, cgst: 2.5, sgst: 2.5, total: 105,
      restaurantName: 'Test Restaurant', createdAt: new Date(),
    })
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Print Station</h1>
          <p className="text-gray-400">Restaurant</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
          <div className="bg-gray-800 rounded-2xl p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Printer className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-bold">Kitchen KOT</h2>
              <Circle className="w-3 h-3 text-green-400 fill-green-400 ml-auto" />
            </div>
            <button onClick={testPrintKOT} className="w-full py-2 bg-green-600 text-white rounded-xl text-sm font-semibold mb-4 hover:bg-green-700 transition-colors">
              Test Print KOT
            </button>
            <div className="space-y-3">
              {kitchenKOTs.map((kot) => (
                <div key={kot.id} className="bg-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Table {kot.table}</span>
                    <span className="text-sm text-gray-400">{kot.time}</span>
                  </div>
                  <div className="text-sm space-y-1 mb-2">
                    {kot.items.map((item, idx) => (
                      <div key={idx}>{item.name} x {item.qty}</div>
                    ))}
                  </div>
                  <span className="px-2 py-1 bg-green-600 text-white rounded-full text-xs">{kot.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-2xl p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Printer className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-bold">Bar KOT</h2>
              <Circle className="w-3 h-3 text-green-400 fill-green-400 ml-auto" />
            </div>
            <button onClick={testPrintKOT} className="w-full py-2 bg-green-600 text-white rounded-xl text-sm font-semibold mb-4 hover:bg-green-700 transition-colors">
              Test Print Bar KOT
            </button>
            <div className="space-y-3">
              {barKOTs.map((kot) => (
                <div key={kot.id} className="bg-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Table {kot.table}</span>
                    <span className="text-sm text-gray-400">{kot.time}</span>
                  </div>
                  <div className="text-sm space-y-1 mb-2">
                    {kot.items.map((item, idx) => (
                      <div key={idx}>{item.name} x {item.qty}</div>
                    ))}
                  </div>
                  <span className="px-2 py-1 bg-green-600 text-white rounded-full text-xs">{kot.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-2xl p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Printer className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-bold">Bill Printer</h2>
              <Circle className="w-3 h-3 text-green-400 fill-green-400 ml-auto" />
            </div>
            <button onClick={testPrintBill} className="w-full py-2 bg-green-600 text-white rounded-xl text-sm font-semibold mb-4 hover:bg-green-700 transition-colors">
              Test Print Bill
            </button>
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
                  <span className="px-2 py-1 bg-green-600 text-white rounded-full text-xs mt-2 inline-block">{bill.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm">
          <p>Printers connected and ready</p>
          <p className="mt-1">Auto-refreshing every 20 seconds</p>
        </div>
      </div>
    </div>
  )
}

export default PrintStation
