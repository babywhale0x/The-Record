## Changes to app/records/[slug]/page.tsx

### 1. Add import at top of file
```tsx
import { cacheLicense, getCachedLicense, getLicenseTimeRemaining } from '@/lib/licenseCache'
```

### 2. Add state after existing useState declarations
```tsx
const [cachedLicense, setCachedLicense] = useState<any>(null)
const [timeRemaining, setTimeRemaining] = useState<string | null>(null)
```

### 3. Add useEffect after existing useEffects to check cache on load
```tsx
useEffect(() => {
  if (!record || !address) return
  const cached = getCachedLicense(record.slug, address)
  if (cached) {
    setCachedLicense(cached)
    setActiveTier(cached.tier)
    setUnlocked(true)
    setTimeRemaining(getLicenseTimeRemaining(record.slug, address))
  }
}, [record, address])
```

### 4. After setUnlocked(true) in handleUnlock, add:
```tsx
// Cache the license so user doesn't pay again
cacheLicense(record.slug, tier, address, '')
setCachedLicense({ tier })
const remaining = getLicenseTimeRemaining(record.slug, address)
setTimeRemaining(remaining)
```

### 5. In the unlocked viewer section, add time remaining display.
Find the viewerHeader div and add below it:
```tsx
{timeRemaining && (
  <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 16px', borderBottom: '1px solid var(--border)' }}>
    ⏱ {timeRemaining}
  </div>
)}
```
