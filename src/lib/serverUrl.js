import { Preferences } from '@capacitor/preferences'

const FALLBACK = import.meta.env.VITE_SAAS_API_URL || 'http://localhost:4000'
const KEY = 'serverUrl'

export let currentBase = FALLBACK

export async function loadServerUrl() {
  try {
    const { value } = await Preferences.get({ key: KEY })
    if (value) currentBase = value
  } catch {}
}

export async function saveServerUrl(url) {
  try {
    await Preferences.set({ key: KEY, value: url })
    currentBase = url
  } catch {}
}

export async function clearServerUrl() {
  try {
    await Preferences.remove({ key: KEY })
  } catch {}
  currentBase = FALLBACK
}
