## Changes to app/records/[slug]/page.tsx

### 1. Add import at top
```tsx
import WatermarkedViewer from '@/components/ui/WatermarkedViewer'
```

### 2. Find the unlocked viewer section and REPLACE it entirely:

Find this block:
```tsx
        ) : (
          <div className={styles.viewer}>
            <div className={styles.viewerHeader}>
              <span className={styles.viewerTier}>{activeTier?.toUpperCase()} ACCESS</span>
              <span className={styles.viewerWatermark}>
                Watermarked · {record.content_hash?.slice(0, 10) || '0x…'}
              </span>
            </div>
            <div className={styles.viewerBody} onContextMenu={(e) => e.preventDefault()}>
              {(fullBody || record.excerpt).split('\n\n').map((para, i) => (
                <p key={i} className={styles.viewerPara}>{para}</p>
              ))}
            </div>
```

Replace with:
```tsx
        ) : (
          <>
            <WatermarkedViewer
              body={fullBody || record.excerpt}
              walletAddress={String(account?.address || 'anonymous')}
              citationId={`CR-${record.slug.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`}
              tier={activeTier || 'view'}
              contentHash={record.content_hash}
            />
```

### 3. Remove the old closing tags for the replaced viewer:
Remove:
```tsx
            </div>
            {record.source_documents && record.source_documents.length > 0 && (
```

The WatermarkedViewer handles its own layout. Keep the source_documents section below it but outside the old viewer div.
