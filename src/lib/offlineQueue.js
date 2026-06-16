const DB_NAME = 'softshape_offline'
const STORE_NAME = 'pending_orders'
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'clientId' })
      }
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = (e) => reject(e.target.error)
  })
}

function genClientId() {
  return 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
}

export function isOnline() {
  return navigator.onLine
}

export async function enqueueOrder(orderPayload) {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  const payload = { ...orderPayload, clientId: orderPayload.clientId || genClientId(), enqueuedAt: Date.now() }
  store.put(payload)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(payload)
    tx.onerror = () => reject(tx.error)
  })
}

export async function flushQueue(apiBase, token) {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const getAll = store.getAll()
  const pending = await new Promise((resolve, reject) => {
    getAll.onsuccess = () => resolve(getAll.result || [])
    getAll.onerror = () => reject(getAll.error)
  })

  if (pending.length === 0) return { flushed: 0 }

  const results = []
  const deleteTx = db.transaction(STORE_NAME, 'readwrite')
  const deleteStore = deleteTx.objectStore(STORE_NAME)

  for (const order of pending) {
    try {
      const res = await fetch(`${apiBase}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(order),
      })
      if (res.ok || res.status === 409) {
        deleteStore.delete(order.clientId)
        results.push({ clientId: order.clientId, status: res.status })
      } else {
        results.push({ clientId: order.clientId, status: res.status, error: await res.text() })
      }
    } catch (err) {
      results.push({ clientId: order.clientId, error: err.message })
    }
  }

  return { flushed: results.filter(r => r.status === 200 || r.status === 409).length, results }
}
