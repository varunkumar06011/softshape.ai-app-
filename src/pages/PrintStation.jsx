import { useState, useEffect } from 'react'
import { Printer, Circle, Loader2 } from 'lucide-react'
import { printKOTViAgent, printBillViaAgent, loadPrinterConfig } from '../lib/printerConfig'
import PrinterSetup from '../components/PrinterSetup'
import toast from 'react-hot-toast'

const mockKOTData = {
  kotNumber: 'TEST-001',
  table: 'T-1',
  section: 'Main Hall',
  captain: 'Test',
  items: [{ name: 'Test Item', qty: 2 }],
}

function getBillTemplate() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.endsWith('_session')) {
        const raw = localStorage.getItem(key)
        if (raw) {
          const session = JSON.parse(raw)
          if (session.billTemplate) return session.billTemplate
        }
      }
    }
  } catch {}
  return 'CLASSIC'
}

function buildMockBillData() {
  const template = getBillTemplate()
  const base = {
    billNumber: 'TEST-001',
    table: 'T-1',
    items: [{ name: 'Test Item', qty: 2, price: 150 }],
    subtotal: 300, cgst: 7.5, sgst: 7.5, total: 315,
    paymentMode: 'CASH',
    template,
  }

  if (template === 'CLASSIC') {
    return {
      ...base,
      restaurantName: 'My Restaurant',
      headerLines: [],
      footerLines: ['Thank you! Visit again'],
      showGstLines: true,
    }
  }

  if (template === 'MINIMAL') {
    return {
      ...base,
      restaurantName: '',
      headerLines: [],
      footerLines: [],
      showGstLines: false,
    }
  }

  if (template === 'HOTEL') {
    return {
      ...base,
      restaurantName: 'HOTEL GRAND',
      address: '12 MG Road, Bangalore',
      gstin: '29ABCDE1234F1Z5',
      headerLines: ['HOTEL GRAND', '12 MG Road, Bangalore', 'GSTIN: 29ABCDE1234F1Z5'],
      footerLines: ['Thank you for your stay'],
      showGstLines: true,
      roomNumber: '___',
    }
  }

  return base
}

const PrintStation = () => {
  const [activeTab, setActiveTab] = useState('queue')
  const [kitchenKOTs, setKitchenKOTs] = useState([])
  const [barKOTs, setBarKOTs] = useState([])
  const [bills, setBills] = useState([])
  const [loadingKey, setLoadingKey] = useState(null)

  useEffect(() => {
    setKitchenKOTs([
      { id: 'kot1', table: 'AC-2', items: [
        { name: 'Paneer Butter Masala', qty: 2, menuType: 'FOOD' },
        { name: 'Butter Naan', qty: 4, menuType: 'FOOD' },
      ], time: '10:30 AM', status: 'PRINTED' },
    ])
    setBarKOTs([
      { id: 'bar1', table: 'AC-2', items: [
        { name: 'Whisky (60ml)', qty: 2, menuType: 'LIQUOR' },
        { name: 'Kingfisher Beer', qty: 1, menuType: 'LIQUOR' },
      ], time: '10:30 AM', status: 'PRINTED' },
    ])
    setBills([
      { id: 'bill1', table: 'AC-1', total: 840, time: '10:15 AM', status: 'PRINTED' },
    ])
  }, [])

  const handlePrint = async (key) => {
    setLoadingKey(key)
    try {
      if (key === 'kitchen') {
        const kot = kitchenKOTs[0]
        if (!kot) { toast.error('No kitchen KOT to print'); return }
        const foodItems = kot.items.filter(i => (i.menuType || 'FOOD') === 'FOOD')
        if (foodItems.length === 0) { toast.error('No food items'); return }
        await printKOTViAgent('kitchen', {
          kotNumber: kot.id.toUpperCase(),
          table: kot.table,
          section: 'Main Hall',
          captain: 'Captain',
          items: foodItems,
        })
        toast.success('Kitchen KOT printed')
      } else if (key === 'bar') {
        const kot = barKOTs[0]
        if (!kot) { toast.error('No bar KOT to print'); return }
        const liquorItems = kot.items.filter(i => (i.menuType || 'FOOD') === 'LIQUOR')
        if (liquorItems.length === 0) { toast.error('No liquor items'); return }
        const config = loadPrinterConfig()
        const target = (config.bar?.ip) ? 'bar' : 'kitchen'
        await printKOTViAgent(target, {
          kotNumber: kot.id.toUpperCase(),
          table: kot.table,
          section: 'Main Hall',
          captain: 'Captain',
          items: liquorItems,
        })
        toast.success(`${target === 'bar' ? 'Bar' : 'Kitchen (fallback)'} KOT printed`)
      } else if (key === 'bill') {
        await printBillViaAgent(buildMockBillData())
        toast.success('Bill printed')
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoadingKey(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Print Station</h1>
          <p className="text-gray-400">Restaurant</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-6 py-2 rounded-xl font-semibold transition-colors ${activeTab === 'queue' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Print Queue
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`px-6 py-2 rounded-xl font-semibold transition-colors ${activeTab === 'setup' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Printer Setup
          </button>
        </div>

        {activeTab === 'queue' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
              <div className="bg-gray-800 rounded-2xl p-4 lg:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Printer className="w-5 h-5 text-green-400" />
                  <h2 className="text-xl font-bold">Kitchen KOT</h2>
                  <Circle className="w-3 h-3 text-green-400 fill-green-400 ml-auto" />
                </div>
                <button
                  onClick={() => handlePrint('kitchen')}
                  disabled={loadingKey === 'kitchen'}
                  className="w-full py-2 bg-green-600 text-white rounded-xl text-sm font-semibold mb-4 hover:bg-green-700 disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                  {loadingKey === 'kitchen' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                  Test Kitchen KOT
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
                <button
                  onClick={() => handlePrint('bar')}
                  disabled={loadingKey === 'bar'}
                  className="w-full py-2 bg-green-600 text-white rounded-xl text-sm font-semibold mb-4 hover:bg-green-700 disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                  {loadingKey === 'bar' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                  Test Bar KOT
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
                <button
                  onClick={() => handlePrint('bill')}
                  disabled={loadingKey === 'bill'}
                  className="w-full py-2 bg-green-600 text-white rounded-xl text-sm font-semibold mb-4 hover:bg-green-700 disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                  {loadingKey === 'bill' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                  Test Bill
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
          </>
        )}

        {activeTab === 'setup' && <PrinterSetup />}
      </div>
    </div>
  )
}

export default PrintStation
