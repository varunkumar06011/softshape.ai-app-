import { useEffect, useState } from 'react'
import { flushQueue } from '../lib/syncEngine'
import { getPendingMutations } from '../lib/localCache'

export function useOfflineSync(slug) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const goOnline = async () => {
      setIsOnline(true)
      await flushQueue(slug)
      const q = await getPendingMutations()
      setPendingCount(q.length)
    }
    const goOffline = () => setIsOnline(false)

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    if (navigator.onLine) goOnline()

    const interval = setInterval(async () => {
      if (navigator.onLine) {
        await flushQueue(slug)
        const q = await getPendingMutations()
        setPendingCount(q.length)
      }
    }, 30000)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      clearInterval(interval)
    }
  }, [slug])

  return { isOnline, pendingCount }
}
