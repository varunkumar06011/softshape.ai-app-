const AGENT_URL = 'http://localhost:8765'
const CONFIG_KEY = 'softshape_printer_config'

// Default config structure
const defaultConfig = () => ({
  kitchen: { ip: '', port: 9100, enabled: false, label: 'Kitchen KOT' },
  bar:     { ip: '', port: 9100, enabled: false, label: 'Bar KOT' },
  bill:    { ip: '', port: 9100, enabled: false, label: 'Bill Printer' },
})

export function loadPrinterConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    return raw ? { ...defaultConfig(), ...JSON.parse(raw) } : defaultConfig()
  } catch {
    return defaultConfig()
  }
}

export function savePrinterConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

export async function checkAgentOnline() {
  try {
    const res = await fetch(`${AGENT_URL}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'ping', ip: '0.0.0.0' }),
      signal: AbortSignal.timeout(2000),
    })
    // Agent is online if it responds at all (even with error)
    return true
  } catch {
    return false
  }
}

export async function testPrinter(ip, port = 9100, restaurantName = 'Test Restaurant') {
  const res = await fetch(`${AGENT_URL}/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'test',
      ip,
      port,
      data: { restaurantName },
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Print failed')
  return json
}

export async function printKOTViAgent(printerKey, kotData) {
  const config = loadPrinterConfig()
  const printer = config[printerKey]
  if (!printer?.enabled || !printer?.ip) throw new Error(`${printerKey} printer not configured`)

  const res = await fetch(`${AGENT_URL}/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'kot',
      ip: printer.ip,
      port: printer.port || 9100,
      data: kotData,
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'KOT print failed')
  return json
}

export async function printBillViaAgent(billData) {
  const config = loadPrinterConfig()
  const printer = config.bill
  if (!printer?.enabled || !printer?.ip) throw new Error('Bill printer not configured')

  const res = await fetch(`${AGENT_URL}/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'bill',
      ip: printer.ip,
      port: printer.port || 9100,
      data: billData,
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Bill print failed')
  return json
}
