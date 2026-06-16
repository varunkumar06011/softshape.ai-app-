import {
  queueMutation,
  saveOrderLocally,
  removeOrderLocally,
  queueKOT,
  cacheMenu,
  cacheTablesForRestaurant
} from './localCache'
import {
  createOrder as apiCreateOrder,
  addItemsToOrder as apiAddItems,
  sendKOT as apiSendKOT,
  settleOrder as apiSettle,
  printBillAPI as apiPrintBill
} from '../saas/saasApi'

function genClientId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` 
}

// ── CREATE ORDER ──────────────────────────────────────────
export async function offlineCreateOrder(payload, slug) {
  const clientId = genClientId()
  const localOrder = {
    id: clientId,
    clientId,
    ...payload,
    status: 'OPEN',
    items: (payload.items || []).map(i => ({ ...i, id: genClientId(), kotSent: false })),
    subtotal: 0, cgst: 0, sgst: 0, total: 0,
    _local: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  // Recalculate totals
  const subtotal = localOrder.items.reduce((s, i) => s + i.price * i.qty, 0)
  localOrder.subtotal = subtotal
  localOrder.cgst = Math.round(subtotal * 0.025 * 100) / 100
  localOrder.sgst = Math.round(subtotal * 0.025 * 100) / 100
  localOrder.total = Math.round((subtotal + localOrder.cgst + localOrder.sgst) * 100) / 100

  await saveOrderLocally(localOrder)

  if (navigator.onLine) {
    try {
      const serverOrder = await apiCreateOrder({ ...payload, clientId }, slug)
      await saveOrderLocally({ ...serverOrder, _local: false })
      return serverOrder
    } catch {}
  }

  await queueMutation({
    id: clientId,
    type: 'CREATE_ORDER',
    payload: { ...payload, clientId },
    createdAt: Date.now(),
  })
  return localOrder
}

// ── ADD ITEMS ─────────────────────────────────────────────
export async function offlineAddItems(order, newItems, slug) {
  const updatedItems = [
    ...order.items,
    ...newItems.map(i => ({ ...i, id: genClientId(), kotSent: false }))
  ]
  const subtotal = updatedItems.reduce((s, i) => s + i.price * i.qty, 0)
  const cgst = Math.round(subtotal * 0.025 * 100) / 100
  const sgst = Math.round(subtotal * 0.025 * 100) / 100
  const total = Math.round((subtotal + cgst + sgst) * 100) / 100
  const updatedOrder = { ...order, items: updatedItems, subtotal, cgst, sgst, total, updatedAt: new Date().toISOString() }
  await saveOrderLocally(updatedOrder)

  if (navigator.onLine && !order._local) {
    try {
      const serverOrder = await apiAddItems(order.id, newItems, slug)
      await saveOrderLocally({ ...serverOrder, _local: false })
      return serverOrder
    } catch {}
  }

  await queueMutation({
    id: genClientId(),
    type: 'ADD_ITEMS',
    payload: { orderId: order.id, items: newItems },
    createdAt: Date.now(),
  })
  return updatedOrder
}

function getLatestOrder(orderId) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('softshape_pos', 2)
    req.onsuccess = (e) => {
      const db = e.target.result
      const tx = db.transaction('orders', 'readonly')
      const store = tx.objectStore('orders')
      const getReq = store.get(orderId)
      getReq.onsuccess = () => resolve(getReq.result)
      getReq.onerror = () => reject(getReq.error)
    }
    req.onerror = () => reject(req.error)
  })
}

// ── SEND KOT ──────────────────────────────────────────────
// NOTE: Always print immediately. Sync to server after.
export async function offlineSendKOT(order, unsentItems, printFn, slug) {
  // 1. Print right now regardless of network
  printFn()

  // 2. Read latest order from cache so dual KOT calls don't overwrite each other
  let latestOrder = order
  try {
    const cached = await getLatestOrder(order.id)
    if (cached) latestOrder = cached
  } catch {}

  // 3. Mark items as kotSent in local cache
  const itemIds = unsentItems.map(i => i.id)
  const updatedOrder = {
    ...latestOrder,
    items: latestOrder.items.map(i =>
      itemIds.includes(i.id) ? { ...i, kotSent: true, kotSentAt: new Date().toISOString() } : i
    ),
    updatedAt: new Date().toISOString(),
  }
  await saveOrderLocally(updatedOrder)

  // 3. Try server sync
  if (navigator.onLine && !order._local) {
    try {
      const serverOrder = await apiSendKOT(order.id, itemIds, slug)
      await saveOrderLocally({ ...serverOrder, _local: false })
      return { order: serverOrder, success: true }
    } catch {}
  }

  // 4. Queue for later sync
  await queueKOT({
    id: genClientId(),
    orderId: order.id,
    itemIds,
    createdAt: Date.now(),
  })
  return { order: updatedOrder, success: true }
}

// ── PRINT BILL ────────────────────────────────────────────
export async function offlinePrintBill(order, printFn, slug) {
  printFn()

  const updatedOrder = { ...order, status: 'BILLED', billPrintedAt: new Date().toISOString() }
  await saveOrderLocally(updatedOrder)

  if (navigator.onLine && !order._local) {
    try {
      const serverOrder = await apiPrintBill(order.id, slug)
      await saveOrderLocally({ ...serverOrder, _local: false })
      return serverOrder
    } catch {}
  }

  await queueMutation({
    id: genClientId(),
    type: 'PRINT_BILL',
    payload: { orderId: order.id },
    createdAt: Date.now(),
  })
  return updatedOrder
}

// ── SETTLE ORDER ──────────────────────────────────────────
export async function offlineSettle(order, paymentMode, slug) {
  const updatedOrder = { ...order, status: 'SETTLED', paymentMode, paidAt: new Date().toISOString() }
  await removeOrderLocally(order.id)

  if (navigator.onLine && !order._local) {
    try {
      return await apiSettle(order.id, paymentMode, slug)
    } catch {}
  }

  await queueMutation({
    id: genClientId(),
    type: 'SETTLE',
    payload: { orderId: order.id, paymentMode },
    createdAt: Date.now(),
  })
  return updatedOrder
}
