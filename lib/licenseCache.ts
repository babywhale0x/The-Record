/**
 * lib/licenseCache.ts
 * Stores purchased licenses in localStorage so readers don't pay twice.
 */

const CACHE_KEY = 'the_record_licenses'

interface CachedLicense {
  slug: string
  tier: string
  walletAddress: string
  purchasedAt: number
  expiresAt: number | null // null = permanent
  txHash?: string
}

function getCache(): CachedLicense[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveCache(licenses: CachedLicense[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(licenses)) } catch {}
}

function getExpiresAt(tier: string): number | null {
  if (tier === 'view') return Date.now() + 48 * 60 * 60 * 1000 // 48h
  return null // cite + license = permanent
}

export function cacheLicense(slug: string, tier: string, walletAddress: string, txHash?: string) {
  const licenses = getCache().filter(l => !(l.slug === slug && l.walletAddress === walletAddress))
  licenses.push({ slug, tier, walletAddress, purchasedAt: Date.now(), expiresAt: getExpiresAt(tier), txHash })
  saveCache(licenses)
}

export function getCachedLicense(slug: string, walletAddress: string): CachedLicense | null {
  if (!walletAddress) return null
  const licenses = getCache()
  const license = licenses.find(l => l.slug === slug && l.walletAddress === walletAddress)
  if (!license) return null
  if (license.expiresAt && Date.now() > license.expiresAt) {
    saveCache(licenses.filter(l => !(l.slug === slug && l.walletAddress === walletAddress)))
    return null
  }
  return license
}

export function hasValidLicense(slug: string, walletAddress: string): boolean {
  return getCachedLicense(slug, walletAddress) !== null
}

export function getLicenseTimeRemaining(slug: string, walletAddress: string): string | null {
  const license = getCachedLicense(slug, walletAddress)
  if (!license) return null
  if (!license.expiresAt) return 'Permanent access'
  const ms = license.expiresAt - Date.now()
  if (ms <= 0) return null
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${mins}m remaining`
}
