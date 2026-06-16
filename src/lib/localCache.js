const DB_NAME = 'softshape_pos'
const DB_VERSION = 2

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('menu')) db.createObjectStore('menu', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('orders')) db.createObjectStore('orders', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('sync_queue')) db.createObjectStore('sync_queue', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('config')) db.createObjectStore('config', { keyPath: 'key' })
      if (!db.objectStoreNames.contains('kot_queue')) db.createObjectStore('kot_queue', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('tables')) db.createObjectStore('tables', { keyPath: 'id' })
    }
  })
}

export async function initDB() {
  await openDB()
}

async function withStore(storeName, mode) {
  const db = await openDB()
  return db.transaction(storeName, mode).objectStore(storeName)
}

function requestToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function cacheMenu(restaurantId, items) {
  const store = await withStore('menu', 'readwrite')
  for (const item of items) {
    await requestToPromise(store.put({ ...item, _restaurantId: restaurantId }))
  }
}

export async function getMenuFromCache(restaurantId) {
  const store = await withStore('menu', 'readonly')
  const all = await requestToPromise(store.getAll())
  return all.filter(i => i._restaurantId === restaurantId)
}

export async function cacheOrders(restaurantId, orders) {
  const store = await withStore('orders', 'readwrite')
  for (const order of orders) {
    await requestToPromise(store.put({ ...order, _restaurantId: restaurantId }))
  }
}

export async function getOrdersFromCache(restaurantId) {
  const store = await withStore('orders', 'readonly')
  const all = await requestToPromise(store.getAll())
  return all.filter(o => o._restaurantId === restaurantId)
}

export async function cacheSections(restaurantId, tables) {
  const store = await withStore('config', 'readwrite')
  await requestToPromise(store.put({ key: `sections_${restaurantId}`, tables }))
}

export async function getSectionsFromCache(restaurantId) {
  const store = await withStore('config', 'readonly')
  const row = await requestToPromise(store.get(`sections_${restaurantId}`))
  return row?.tables || []
}

export async function queueMutation(mutation) {
  const store = await withStore('sync_queue', 'readwrite')
  await requestToPromise(store.put(mutation))
}

export async function getPendingMutations() {
  const store = await withStore('sync_queue', 'readonly')
  return requestToPromise(store.getAll())
}

export async function markMutationSynced(id) {
  const store = await withStore('sync_queue', 'readwrite')
  await requestToPromise(store.delete(id))
}

export function isOnline() {
  return navigator.onLine
}

export async function cacheTablesForRestaurant(restaurantId, tables) {
  const store = await withStore('tables', 'readwrite')
  await requestToPromise(store.put({ id: `tables_${restaurantId}`, tables }))
}

export async function getTablesFromCache(restaurantId) {
  const store = await withStore('tables', 'readonly')
  const row = await requestToPromise(store.get(`tables_${restaurantId}`))
  return row?.tables || []
}

export async function saveOrderLocally(order) {
  const store = await withStore('orders', 'readwrite')
  await requestToPromise(store.put(order))
}

export async function removeOrderLocally(orderId) {
  const store = await withStore('orders', 'readwrite')
  await requestToPromise(store.delete(orderId))
}

export async function queueKOT(kotEntry) {
  const store = await withStore('kot_queue', 'readwrite')
  await requestToPromise(store.put(kotEntry))
}

export async function getPendingKOTs() {
  const store = await withStore('kot_queue', 'readonly')
  return requestToPromise(store.getAll())
}

export async function markKOTSynced(id) {
  const store = await withStore('kot_queue', 'readwrite')
  await requestToPromise(store.delete(id))
}
