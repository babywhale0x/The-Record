'use client'
import { useState, useEffect } from 'react'
import { CONTENT_TYPES, LICENSE_TIERS } from '@/lib/content-types'
import ContentTypeBadge from '@/components/ui/ContentTypeBadge'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import styles from './record.module.css'

interface SourceDoc { id: string; name: string; content_hash: string; blob_name?: string }
interface RecordData {
  id: string; slug: string; title: string; excerpt: string
  content_type: string; publisher_name: string; tags: string[]
  blob_name?: string; aptos_tx_hash?: string; content_hash?: string
  publisher_address?: string; shelby_network?: string; price_view: number; price_cite: number
  price_license: number; created_at: string
  source_documents?: SourceDoc[]
}

export default function RecordPage({ params }: { params: { slug: string } }) {
  const [record, setRecord] = useState<RecordData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTier, setActiveTier] = useState<string | null>(null)
  const [unlocking, setUnlocking] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [fullBody, setFullBody] = useState<string | null>(null)
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const { account, signAndSubmitTransaction, connected } = useWallet()

  useEffect(() => {
    fetch(`/api/records/${params.slug}`)
      .then((r) => r.json())
      .then((data) => { if (data.record) setRecord(data.record); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.slug])

  const PLATFORM_ADDRESS = '0xa8c20d49b063e41aff19123fd2263d0b9945ec9708ce9d7ec72d68f485043cb8'
  const PLATFORM_FEE_PCT = 0.1 // 10% to platform

  const handleUnlock = async (tier: string) => {
    if (!record?.blob_name) return
    setUnlocking(true)
    setActiveTier(tier)
    setUnlockError(null)

    try {
      // ── Payment gate ────────────────────────────────────────────────────
      const priceMap: Record<string, number> = {
        view: record.price_view,
        cite: record.price_cite,
        license: record.price_license,
      }
      const priceOctas = Math.round(priceMap[tier] ?? record.price_view)
      // Consider free only if explicitly set to 0, minimum payable is 1 octa
      const isFree = priceOctas === 0

      if (!isFree) {
        // Must be connected to pay
        if (!connected || !signAndSubmitTransaction) {
          throw new Error('Connect your wallet to unlock this record.')
        }
        if (!record.publisher_address) {
          throw new Error('Publisher address not found — cannot process payment.')
        }

        const platformOctas = Math.round(priceOctas * PLATFORM_FEE_PCT)
        const publisherOctas = priceOctas - platformOctas

        // Pay publisher (90%)
        if (publisherOctas > 0) {
          await signAndSubmitTransaction({
            data: {
              function: '0x1::coin::transfer',
              typeArguments: ['0x1::aptos_coin::AptosCoin'],
              functionArguments: [record.publisher_address, publisherOctas],
            },
          } as any)
        }

        // Pay platform (10%)
        if (platformOctas > 0) {
          await signAndSubmitTransaction({
            data: {
              function: '0x1::coin::transfer',
              typeArguments: ['0x1::aptos_coin::AptosCoin'],
              functionArguments: [PLATFORM_ADDRESS, platformOctas],
            },
          } as any)
        }
      }

      // ── Fetch content from Shelby ──────────────────────────────────────
      const addr = record.publisher_address || ''
      const streamPath = addr ? `${addr}/${record.blob_name}` : record.blob_name
      const res = await fetch(`/api/stream/${streamPath}`)
      if (!res.ok) throw new Error(`Failed to fetch content: ${res.status}`)

      const raw = await res.text()
      try {
        const parsed = JSON.parse(raw)
        setFullBody(parsed.body || parsed.excerpt || raw)
      } catch {
        setFullBody(raw)
      }

      setUnlocked(true)
    } catch (err: any) {
      setUnlockError(err?.message || 'Failed to unlock. Please try again.')
    } finally {
      setUnlocking(false)
    }
  }

  if (loading) return (
    <main className={styles.page}>
      <div className={styles.notFound}><p>Loading…</p></div>
    </main>
  )

  if (!record) return (
    <main className={styles.page}>
      <div className={styles.notFound}>
        <h1>Record not found</h1>
        <a href="/">← Back to home</a>
      </div>
    </main>
  )

  const date = new Date(record.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
  const txHash = record.aptos_tx_hash || ''
  // Prices stored as octas (1 APT = 1e8 octas)
  const toApt = (octas: number) => {
    const apt = octas / 1e8
    // Show meaningful decimals, strip trailing zeros
    if (apt === 0) return '0'
    if (apt >= 1) return apt.toFixed(2)
    return apt.toFixed(8).replace(/0+$/, '')
  }
  const tiers = {
    view: toApt(record.price_view),
    cite: toApt(record.price_cite),
    license: toApt(record.price_license),
  }

  return (
    <main className={styles.page}>
      <div className={styles.backRow}>
        <a href="/" className={styles.back}>← Records</a>
      </div>

      <div className={styles.header}>
        <ContentTypeBadge type={record.content_type as any} size="md" />
        <h1 className={styles.title}>{record.title}</h1>
        <p className={styles.excerpt}>{record.excerpt}</p>
        <div className={styles.meta}>
          <span className={styles.publisher}>{record.publisher_name}</span>
          <span className={styles.metaDot}>·</span>
          <span className={styles.date}>{date}</span>
        </div>
        {txHash && (
          <div className={styles.proofBar}>
            <div className={styles.proofItem}>
              <span className={styles.proofLabel}>APTOS TX</span>
              <span className={styles.proofValue}>{txHash.slice(0, 10)}…{txHash.slice(-6)}</span>
            </div>
            <div className={styles.proofDivider} />
            <div className={styles.proofItem}>
              <span className={styles.proofLabel}>SHELBY</span>
              <span className={styles.proofValue}>{(record.blob_name || '').slice(0, 20)}…</span>
            </div>
            <div className={styles.proofDivider} />
            <div className={styles.proofItem}>
              <span className={styles.proofLabel}>NETWORK</span>
              <span className={styles.proofValue}>{record.shelby_network || 'testnet'}</span>
            </div>
            <span className={styles.proofVerified}>✓ VERIFIED</span>
          </div>
        )}
      </div>

      <div className={styles.viewerWrap}>
        {!unlocked ? (
          <>
            <div className={styles.preview}>
              <div className={styles.previewContent}>
                <p className={styles.previewText}>
                  {record.excerpt}{record.excerpt.length > 200 ? '…' : ''}
                </p>
              </div>
              <div className={styles.previewFade} />
            </div>

            <div className={styles.lockedBanner}>
              <span className={styles.lockedIcon}>🔒</span>
              <span className={styles.lockedText}>
                Full document locked. Select a license tier below to unlock.
              </span>
            </div>

            {unlockError && (
              <div style={{ color: '#ef4444', fontSize: 13, padding: '10px 0' }}>
                ⚠ {unlockError}
              </div>
            )}

            <div className={styles.tiers}>
              <h2 className={styles.tiersTitle}>Choose a license</h2>
              <div className={styles.tierGrid}>
                {Object.values(LICENSE_TIERS).map((tier) => {
                  const price = tiers[tier.id as keyof typeof tiers]
                  return (
                    <div
                      key={tier.id}
                      className={`${styles.tierCard} ${activeTier === tier.id ? styles.tierCardActive : ''}`}
                      style={activeTier === tier.id ? { borderColor: tier.color } : {}}
                    >
                      <div className={styles.tierTop}>
                        <span className={styles.tierLabel} style={{ color: tier.color }}>{tier.label}</span>
                        <span className={styles.tierPrice}>{price != null ? `${price} APT` : 'Custom'}</span>
                      </div>
                      <p className={styles.tierDesc}>{tier.description}</p>
                      <ul className={styles.tierFeatures}>
                        {tier.features.map((f) => (
                          <li key={f}>
                            <span className={styles.tierCheck} style={{ color: tier.color }}>✓</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button
                        className={styles.tierBtn}
                        style={{ background: tier.color }}
                        onClick={() => handleUnlock(tier.id)}
                        disabled={unlocking}
                      >
                        {unlocking && activeTier === tier.id
                          ? 'Unlocking…'
                          : tier.id === 'institutional'
                          ? 'Contact us →'
                          : `Unlock for ${price} APT →`}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
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
            {record.source_documents && record.source_documents.length > 0 && (
              <div className={styles.sourceDocs}>
                <h3 className={styles.sourceDocsTitle}>Source Documents</h3>
                {record.source_documents.map((doc) => (
                  <div key={doc.id} className={styles.sourceDoc}>
                    <span className={styles.sourceDocIcon}>📎</span>
                    <div className={styles.sourceDocInfo}>
                      <span className={styles.sourceDocName}>{doc.name}</span>
                      <span className={styles.sourceDocHash}>{doc.content_hash?.slice(0, 24)}…</span>
                    </div>
                    {doc.blob_name && (
                      <a
                        href={`/api/stream/${record.publisher_address ? record.publisher_address + '/' : ''}${doc.blob_name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.sourceDocVerify}
                      >
                        Download ↓
                      </a>
                    )}
                    <button className={styles.sourceDocVerify}>Verify ✓</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.tags}>
        {(record.tags || []).map((tag) => (
          <span key={tag} className={styles.tag}>#{tag}</span>
        ))}
      </div>
    </main>
  )
}
