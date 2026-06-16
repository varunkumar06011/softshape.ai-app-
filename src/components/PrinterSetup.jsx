import { useState, useEffect } from 'react'
import { Printer, Wifi, WifiOff, Check, X, Loader2, Save, RefreshCw } from 'lucide-react'
import { loadPrinterConfig, savePrinterConfig, testPrinter, checkAgentOnline } from '../lib/printerConfig'
import toast from 'react-hot-toast'

const PRINTER_KEYS = ['kitchen', 'bar', 'bill']

export default function PrinterSetup() {
  const [config, setConfig] = useState(loadPrinterConfig())
  const [agentOnline, setAgentOnline] = useState(false)
  const [checkingAgent, setCheckingAgent] = useState(false)
  const [testingKey, setTestingKey] = useState(null)
  const [testResults, setTestResults] = useState({})

  useEffect(() => {
    checkAgent()
  }, [])

  const checkAgent = async () => {
    setCheckingAgent(true)
    const online = await checkAgentOnline()
    setAgentOnline(online)
    setCheckingAgent(false)
  }

  const updatePrinter = (key, field, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  const handleTest = async (key) => {
    const printer = config[key]
    if (!printer.ip) {
      if (key === 'bar') return
      toast.error('Enter printer IP first')
      return
    }
    setTestingKey(key)
    try {
      await testPrinter(printer.ip, printer.port, 'Test Restaurant')
      setTestResults(prev => ({ ...prev, [key]: { ok: true, msg: 'Test successful!' } }))
      toast.success(`${printer.label} test successful`)
    } catch (err) {
      setTestResults(prev => ({ ...prev, [key]: { ok: false, msg: err.message } }))
      toast.error(`${printer.label}: ${err.message}`)
    } finally {
      setTestingKey(null)
      setTimeout(() => {
        setTestResults(prev => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      }, 5000)
    }
  }

  const handleSave = () => {
    savePrinterConfig(config)
    toast.success('Saved!')
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Printer className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold">Printer Setup</h2>
      </div>

      {/* Agent Status */}
      <div className="flex items-center justify-between bg-gray-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          {agentOnline ? (
            <>
              <Wifi className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold">Agent Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-semibold">Agent Offline — run SoftshapePrintAgent.exe</span>
            </>
          )}
        </div>
        <button
          onClick={checkAgent}
          disabled={checkingAgent}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${checkingAgent ? 'animate-spin' : ''}`} />
          Check Again
        </button>
      </div>

      {/* Printer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {PRINTER_KEYS.map(key => {
          const printer = config[key]
          const result = testResults[key]
          return (
            <div key={key} className="bg-gray-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-lg">{printer.label}</span>
                <button
                  onClick={() => updatePrinter(key, 'enabled', !printer.enabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${printer.enabled ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${printer.enabled ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">IP Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 192.168.1.100"
                    value={printer.ip}
                    onChange={e => updatePrinter(key, 'ip', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Port</label>
                  <input
                    type="number"
                    value={printer.port}
                    onChange={e => updatePrinter(key, 'port', Number(e.target.value))}
                    className="w-24 px-3 py-2 bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={() => handleTest(key)}
                disabled={testingKey === key || !printer.ip}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {testingKey === key ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                Test Print
              </button>

              {result && (
                <div className={`mt-3 flex items-center gap-2 text-sm ${result.ok ? 'text-green-400' : 'text-red-400'}`}>
                  {result.ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  <span>{result.msg}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Save */}
      <div className="flex justify-center">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-semibold transition-colors"
        >
          <Save className="w-5 h-5" />
          Save Configuration
        </button>
      </div>
    </div>
  )
}
