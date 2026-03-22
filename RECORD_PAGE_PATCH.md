## Changes needed in app/records/[slug]/page.tsx

### 1. Add import at top
```tsx
import CitationModal from '@/components/ui/CitationModal'
```

### 2. Add state after existing useState declarations
```tsx
const [citation, setCitation] = useState<any>(null)
const [showCitation, setShowCitation] = useState(false)
```

### 3. After the unlock succeeds (after setUnlocked(true)), add:
```tsx
// Generate citation if Cite or License tier
if (tier === 'cite' || tier === 'license') {
  try {
    const citRes = await fetch('/api/citation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: record.slug,
        licenseeAddress: String(account?.address || ''),
        txHash: '', // contract tx hash - optional
        tier,
      }),
    })
    const citData = await citRes.json()
    if (citData.citation) {
      setCitation(citData.citation)
      setShowCitation(true)
    }
  } catch (e) {
    console.warn('Citation generation failed:', e)
  }
}
```

### 4. Add citation modal at bottom of return, before closing </main>
```tsx
{showCitation && citation && (
  <CitationModal
    citation={citation}
    onClose={() => setShowCitation(false)}
  />
)}
```
