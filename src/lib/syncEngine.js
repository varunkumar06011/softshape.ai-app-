import { getPendingMutations, markMutationSynced, getPendingKOTs, markKOTSynced } from './localCache'

const SAAS_API = import.meta.env.VITE_SAAS_API_URL || 'http://localhost:4000'

function tenantAuthHeader(slug) {
  const token = localStorage.getItem(`tenant_${slug}_token`)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function flushOrderMutations(slug) {
  const mutations = await getPendingMutations()
  if (mutations.length === 0) return

  try {
    const res = await fetch(`${SAAS_API}/api/orders/sync-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...tenantAuthHeader(slug) },
      body: JSON.stringify({ mutations })
    })
    const { results } = await res.json()
    for (const result of results) {
      if (result.status === 'ok' || result.status === 'duplicate') {
        await markMutationSynced(result.id)
      }
    }
  } catch (e) {
    console.warn('Batch sync failed:', e.message)
  }
}

async function flushKOTQueue(slug) {
  const kots = await getPendingKOTs()
  if (kots.length === 0) return
  for (const kot of kots) {
    try {
      const res = await fetch(
        `${SAAS_API}/api/orders/${kot.orderId}/send-kot`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...tenantAuthHeader(slug) },
          body: JSON.stringify({ itemIds: kot.itemIds }),
        }
      )
      if (res.ok) await markKOTSynced(kot.id)
    } catch {}
  }
}

export async function flushQueue(slug) {
  await flushOrderMutations(slug)
  await flushKOTQueue(slug)
}
