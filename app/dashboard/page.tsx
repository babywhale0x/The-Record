'use client'

import { useState, useRef } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { useWalletModal } from '@/components/wallet/WalletModal'
import { CONTENT_TYPE_LIST } from '@/lib/content-types'
import styles from './dashboard.module.css'

type View = 'overview' | 'new-record' | 'my-records'
type PublishStep = 'write' | 'documents' | 'pricing' | 'review'
type PublishStatus = 'idle' | 'uploading' | 'success' | 'error'

interface DocFile {
  file: File
  id: string
}

interface RecordForm {
  title: string
  excerpt: string
  body: string
  contentType: string
  tags: string
  priceView: string
  priceCite: string
  priceLicense: string
}

const EMPTY_FORM: RecordForm = {
  title: '',
  excerpt: '',
  body: '',
  contentType: '',
  tags: '',
  priceView: '5',
  priceCite: '19',
  priceLicense: '99',
}

export default function DashboardPage() {
  const { connected, account } = useWallet()
  const { open } = useWalletModal()
  const [view, setView] = useState<View>('overview')
  const [publishStep, setPublishStep] = useState<PublishStep>('write')
  const [form, setForm] = useState<RecordForm>(EMPTY_FORM)
  const [docs, setDocs] = useState<DocFile[]>([])
  const [status, setStatus] = useState<PublishStatus>('idle')
  const [publishedSlug, setPublishedSlug] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [myRecords, setMyRecords] = useState<any[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const up = (field: keyof RecordForm, val: string) =>
    setForm(p => ({ ...p, [field]: val }))

  const addDocs = (files: FileList | null) => {
    if (!files) return
    const newDocs = Array.from(files).map(file => ({
      file,
      id: Math.random().toString(36).slice(2),
    }))
    setDocs(p => [...p, ...newDocs])
  }

  const removeDoc = (id: string) => setDocs(p => p.filter(d => d.id !== id))

  const loadMyRecords = async () => {
    setLoadingRecords(true)
    try {
      const res = await fetch('/api/dashboard/records')
      if (res.ok) {
        const data = await res.json()
        setMyRecords(data.records || [])
      }
    } catch {}
    setLoadingRecords(false)
  }

  const handlePublish = async () => {
    setStatus('uploading')
    setErrorMsg('')

    try {
      const slug = form.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80)

      const fd = new FormData()
      fd.append('article', JSON.stringify({
        slug,
        title: form.title,
        excerpt: form.excerpt,
        body: form.body,
        contentType: form.contentType,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        priceView: parseFloat(form.priceView),
        priceCite: parseFloat(form.priceCite),
        priceLicense: parseFloat(form.priceLicense),
        publisherAddress: account?.address?.toString() || '',
      }))

      for (const doc of docs) {
        fd.append('documents', doc.file)
      }

      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { Authorization: 'Bearer dashboard' },
        body: fd,
      })

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Publish failed' }))
        throw new Error(error || 'Publish failed')
      }

      setPublishedSlug(slug)
      setStatus('success')
      setForm(EMPTY_FORM)
      setDocs([])
      setPublishStep('write')
    } catch (err: any) {
      setErrorMsg(err?.message || 'Something went wrong')
      setStatus('error')
    }
  }

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <main className={styles.page}>
        <header className={styles.topBar}>
          <h1 className={styles.title}>Publisher Dashboard</h1>
        </header>
        <div className={styles.gateState}>
          <div className={styles.gateIcon}>⬡</div>
          <h2 className={styles.gateHeading}>Connect your wallet to publish</h2>
          <p className={styles.gateBody}>
            Your wallet is your publisher identity on The Record. Connect to access your dashboard and publish records.
          </p>
          <button className={styles.connectBtn} onClick={open}>Connect Wallet →</button>
        </div>
      </main>
    )
  }

  const shortAddr = account?.address
    ? `${account.address.toString().slice(0, 8)}...${account.address.toString().slice(-6)}`
    : ''

  // ── Success state ──────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <main className={styles.page}>
        <header className={styles.topBar}>
          <h1 className={styles.title}>Publisher Dashboard</h1>
        </header>
        <div className={styles.successState}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.successHeading}>Record published.</h2>
          <p className={styles.successBody}>
            Your record has been uploaded to Shelby and committed to the Aptos blockchain. It is now permanently archived.
          </p>
          <div className={styles.successActions}>
            <a href={`/records/${publishedSlug}`} className={styles.viewBtn}>View Record →</a>
            <button className={styles.newBtn} onClick={() => { setStatus('idle'); setView('new-record') }}>
              Publish Another
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <h1 className={styles.title}>Publisher Dashboard</h1>
        <div className={styles.topBarRight}>
          <span className={styles.connectedAddr}>⬡ {shortAddr}</span>
        </div>
      </header>

      {/* Nav tabs */}
      <div className={styles.tabs}>
        {([
          ['overview', 'Overview'],
          ['new-record', 'New Record'],
          ['my-records', 'My Records'],
        ] as [View, string][]).map(([id, label]) => (
          <button
            key={id}
            className={`${styles.tab} ${view === id ? styles.tabActive : ''}`}
            onClick={() => {
              setView(id)
              if (id === 'my-records') loadMyRecords()
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {view === 'overview' && (
        <div className={styles.content}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statNum}>0</span>
              <span className={styles.statLabel}>Records published</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>$0.00</span>
              <span className={styles.statLabel}>Total earned</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>0</span>
              <span className={styles.statLabel}>Licenses sold</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>0</span>
              <span className={styles.statLabel}>Total views</span>
            </div>
          </div>

          <div className={styles.quickActions}>
            <h2 className={styles.sectionTitle}>Quick actions</h2>
            <div className={styles.actionCards}>
              <button className={styles.actionCard} onClick={() => setView('new-record')}>
                <span className={styles.actionIcon}>✎</span>
                <span className={styles.actionLabel}>Write new record</span>
                <span className={styles.actionDesc}>Upload text, documents, and source files</span>
              </button>
              <button className={styles.actionCard} onClick={() => { setView('my-records'); loadMyRecords() }}>
                <span className={styles.actionIcon}>◈</span>
                <span className={styles.actionLabel}>View my records</span>
                <span className={styles.actionDesc}>Manage published and draft records</span>
              </button>
            </div>
          </div>

          <div className={styles.infoBox}>
            <h3 className={styles.infoTitle}>How publishing works</h3>
            <div className={styles.infoSteps}>
              {[
                ['01', 'Write your record', 'Add a title, body, and excerpt. Use markdown formatting.'],
                ['02', 'Attach source documents', 'Upload PDFs, spreadsheets, images — any supporting evidence.'],
                ['03', 'Set your prices', 'Choose prices for View, Cite, and License tiers.'],
                ['04', 'Publish to chain', 'Your record is uploaded to Shelby and committed to Aptos. Permanent.'],
              ].map(([n, t, d]) => (
                <div key={n} className={styles.infoStep}>
                  <span className={styles.infoNum}>{n}</span>
                  <div>
                    <strong>{t}</strong>
                    <p>{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── NEW RECORD ── */}
      {view === 'new-record' && (
        <div className={styles.content}>
          {/* Step indicator */}
          <div className={styles.steps}>
            {(['write', 'documents', 'pricing', 'review'] as PublishStep[]).map((s, i) => (
              <div key={s} className={`${styles.step} ${publishStep === s ? styles.stepActive : ''} ${
                ['write','documents','pricing','review'].indexOf(publishStep) > i ? styles.stepDone : ''
              }`}>
                <span className={styles.stepNum}>{i + 1}</span>
                <span className={styles.stepLabel}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
              </div>
            ))}
          </div>

          {/* Step 1 — Write */}
          {publishStep === 'write' && (
            <div className={styles.formSection}>
              <h2 className={styles.formTitle}>Write your record</h2>

              <div className={styles.field}>
                <label className={styles.label}>Title <span className={styles.req}>*</span></label>
                <input
                  className={styles.input}
                  placeholder="e.g. NDDC Shell Companies: Full Fund Flow 2019–2024"
                  value={form.title}
                  onChange={e => up('title', e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Content type <span className={styles.req}>*</span></label>
                <div className={styles.typeGrid}>
                  {CONTENT_TYPE_LIST.map(ct => (
                    <button
                      key={ct.id}
                      className={`${styles.typeBtn} ${form.contentType === ct.id ? styles.typeBtnActive : ''}`}
                      style={form.contentType === ct.id ? { borderColor: ct.border, background: ct.bg, color: ct.color } : {}}
                      onClick={() => up('contentType', ct.id)}
                    >
                      {ct.icon} {ct.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Excerpt <span className={styles.req}>*</span></label>
                <span className={styles.hint}>2–3 sentences summarising the record. Shown in feed and cards.</span>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  placeholder="What this record reveals, in plain language..."
                  value={form.excerpt}
                  onChange={e => up('excerpt', e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Body <span className={styles.req}>*</span></label>
                <span className={styles.hint}>Full record content. Markdown supported.</span>
                <textarea
                  className={styles.textarea}
                  rows={16}
                  placeholder={`## Summary\n\nWrite your full record here...\n\n## Evidence\n\n...`}
                  value={form.body}
                  onChange={e => up('body', e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Tags</label>
                <span className={styles.hint}>Comma-separated. e.g. nigeria, corruption, NDDC</span>
                <input
                  className={styles.input}
                  placeholder="tag1, tag2, tag3"
                  value={form.tags}
                  onChange={e => up('tags', e.target.value)}
                />
              </div>

              <div className={styles.formNav}>
                <div />
                <button
                  className={styles.nextBtn}
                  onClick={() => setPublishStep('documents')}
                  disabled={!form.title || !form.contentType || !form.excerpt || !form.body}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Documents */}
          {publishStep === 'documents' && (
            <div className={styles.formSection}>
              <h2 className={styles.formTitle}>Attach source documents</h2>
              <p className={styles.formSub}>PDFs, spreadsheets, images, or any supporting evidence. Optional but recommended.</p>

              <div
                className={styles.dropzone}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); addDocs(e.dataTransfer.files) }}
              >
                <span className={styles.dropzoneIcon}>⊕</span>
                <span className={styles.dropzoneText}>Click to upload or drag files here</span>
                <span className={styles.dropzoneHint}>PDF, DOCX, XLSX, PNG, JPG — max 50MB each</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={e => addDocs(e.target.files)}
              />

              {docs.length > 0 && (
                <div className={styles.docList}>
                  {docs.map(doc => (
                    <div key={doc.id} className={styles.docItem}>
                      <span className={styles.docIcon}>📄</span>
                      <span className={styles.docName}>{doc.file.name}</span>
                      <span className={styles.docSize}>{(doc.file.size / 1024).toFixed(0)} KB</span>
                      <button className={styles.docRemove} onClick={() => removeDoc(doc.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.formNav}>
                <button className={styles.backBtn} onClick={() => setPublishStep('write')}>← Back</button>
                <button className={styles.nextBtn} onClick={() => setPublishStep('pricing')}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Pricing */}
          {publishStep === 'pricing' && (
            <div className={styles.formSection}>
              <h2 className={styles.formTitle}>Set your prices</h2>
              <p className={styles.formSub}>Readers pay in APT. Prices shown in USD equivalent.</p>

              <div className={styles.pricingGrid}>
                {[
                  { tier: 'View', key: 'priceView' as const, desc: '48h read-only access, watermarked', suggested: '$5' },
                  { tier: 'Cite', key: 'priceCite' as const, desc: 'Permanent citation rights + signed PDF', suggested: '$19' },
                  { tier: 'License', key: 'priceLicense' as const, desc: 'Full download + Certificate of Authenticity', suggested: '$99' },
                ].map(({ tier, key, desc, suggested }) => (
                  <div key={tier} className={styles.priceCard}>
                    <div className={styles.priceCardTop}>
                      <span className={styles.priceTier}>{tier}</span>
                      <span className={styles.priceSuggested}>Suggested: {suggested}</span>
                    </div>
                    <p className={styles.priceDesc}>{desc}</p>
                    <div className={styles.priceInputWrap}>
                      <span className={styles.priceCurrency}>$</span>
                      <input
                        className={styles.priceInput}
                        type="number"
                        min="0"
                        step="0.01"
                        value={form[key]}
                        onChange={e => up(key, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.institutionalNote}>
                <span>⚖</span>
                <span>Institutional tier pricing is set by custom contract — handled separately after publish.</span>
              </div>

              <div className={styles.formNav}>
                <button className={styles.backBtn} onClick={() => setPublishStep('documents')}>← Back</button>
                <button className={styles.nextBtn} onClick={() => setPublishStep('review')}>
                  Review →
                </button>
              </div>
            </div>
          )}

          {/* Step 4 — Review & publish */}
          {publishStep === 'review' && (
            <div className={styles.formSection}>
              <h2 className={styles.formTitle}>Review & publish</h2>
              <p className={styles.formSub}>Once published, this record is permanently archived on-chain and cannot be deleted.</p>

              <div className={styles.reviewCard}>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Title</span>
                  <span className={styles.reviewValue}>{form.title}</span>
                </div>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Type</span>
                  <span className={styles.reviewValue}>{form.contentType}</span>
                </div>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Documents</span>
                  <span className={styles.reviewValue}>{docs.length} file{docs.length !== 1 ? 's' : ''}</span>
                </div>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Pricing</span>
                  <span className={styles.reviewValue}>
                    View ${form.priceView} · Cite ${form.priceCite} · License ${form.priceLicense}
                  </span>
                </div>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Publisher</span>
                  <span className={styles.reviewValue} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    {shortAddr}
                  </span>
                </div>
              </div>

              <div className={styles.chainInfo}>
                <span className={styles.chainIcon}>⛓</span>
                <div>
                  <strong>What happens when you publish:</strong>
                  <ol className={styles.chainSteps}>
                    <li>Record uploaded to Shelby Protocol (decentralised storage)</li>
                    <li>Content hash committed to Aptos blockchain</li>
                    <li>Record saved to The Record database</li>
                    <li>Live on your profile and the feed immediately</li>
                  </ol>
                </div>
              </div>

              {status === 'error' && (
                <div className={styles.errorBox}>⚠ {errorMsg}</div>
              )}

              <div className={styles.formNav}>
                <button className={styles.backBtn} onClick={() => setPublishStep('pricing')}>← Back</button>
                <button
                  className={styles.publishBtn}
                  onClick={handlePublish}
                  disabled={status === 'uploading'}
                >
                  {status === 'uploading' ? (
                    <><span className={styles.spinner} /> Publishing to chain…</>
                  ) : (
                    'Publish Record →'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MY RECORDS ── */}
      {view === 'my-records' && (
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>My Records</h2>

          {loadingRecords ? (
            <div className={styles.loading}>Loading records…</div>
          ) : myRecords.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>◈</span>
              <p>No records published yet.</p>
              <button className={styles.newBtn} onClick={() => setView('new-record')}>
                Publish your first record →
              </button>
            </div>
          ) : (
            <div className={styles.recordsList}>
              {myRecords.map((r: any) => (
                <div key={r.id} className={styles.recordRow}>
                  <div className={styles.recordRowLeft}>
                    <span className={styles.recordTitle}>{r.title}</span>
                    <div className={styles.recordMeta}>
                      <span>{r.content_type}</span>
                      <span>·</span>
                      <span>{new Date(r.published_at).toLocaleDateString()}</span>
                      <span>·</span>
                      <span>{r.view_count} views</span>
                    </div>
                  </div>
                  <div className={styles.recordRowRight}>
                    <span className={r.blob_name ? styles.badgeLive : styles.badgeDraft}>
                      {r.blob_name ? 'Live' : 'Draft'}
                    </span>
                    <a href={`/records/${r.slug}`} className={styles.viewLink}>View →</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  )
}
