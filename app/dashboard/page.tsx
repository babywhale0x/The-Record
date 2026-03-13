'use client'

import { useState, useRef, useEffect } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { useWalletModal } from '@/components/wallet/WalletModal'
import { CONTENT_TYPE_LIST } from '@/lib/content-types'
import { uploadFileFromBrowser, type BrowserUploadProgress, type BrowserUploadResult } from '@/lib/shelby-browser'
import styles from './dashboard.module.css'

type View = 'overview' | 'new-record' | 'my-records'
type PublishStep = 'write' | 'documents' | 'pricing' | 'review'
type PublishStatus = 'idle' | 'uploading' | 'success' | 'error'
type PublisherStatus = 'loading' | 'approved' | 'pending' | 'none'

interface DocFile { file: File; id: string }

interface RecordForm {
  title: string; excerpt: string; body: string; contentType: string
  tags: string; priceView: string; priceCite: string; priceLicense: string
}

const EMPTY_FORM: RecordForm = {
  title: '', excerpt: '', body: '', contentType: '',
  tags: '', priceView: '5', priceCite: '19', priceLicense: '99',
}

export default function DashboardPage() {
  const { connected, account, signAndSubmitTransaction } = useWallet()
  const { open } = useWalletModal()
  const [publisherStatus, setPublisherStatus] = useState<PublisherStatus>('loading')
  const [view, setView] = useState<View>('overview')
  const [publishStep, setPublishStep] = useState<PublishStep>('write')
  const [form, setForm] = useState<RecordForm>(EMPTY_FORM)
  const [docs, setDocs] = useState<DocFile[]>([])
  const [status, setStatus] = useState<PublishStatus>('idle')
  const [publishedSlug, setPublishedSlug] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [myRecords, setMyRecords] = useState<any[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const address = account?.address?.toString()
  const shortAddr = address ? `${address.slice(0, 8)}...${address.slice(-6)}` : ''

  useEffect(() => {
    if (!connected || !address) { setPublisherStatus('none'); return }
    setPublisherStatus('loading')
    fetch(`/api/publisher/status?address=${encodeURIComponent(address)}`)
      .then(r => r.json())
      .then(d => setPublisherStatus(d.status))
      .catch(() => setPublisherStatus('none'))
  }, [connected, address])

  const up = (field: keyof RecordForm, val: string) => setForm(p => ({ ...p, [field]: val }))
  const addDocs = (files: FileList | null) => {
    if (!files) return
    setDocs(p => [...p, ...Array.from(files).map(file => ({ file, id: Math.random().toString(36).slice(2) }))])
  }
  const removeDoc = (id: string) => setDocs(p => p.filter(d => d.id !== id))

  const loadMyRecords = async () => {
    setLoadingRecords(true)
    try {
      const res = await fetch(`/api/dashboard/records${address ? `?address=${address}` : ''}`)
      if (res.ok) { const d = await res.json(); setMyRecords(d.records || []) }
    } catch {}
    setLoadingRecords(false)
  }

  const handlePublish = async () => {
    if (!address || !signAndSubmitTransaction) return
    setStatus('uploading'); setErrorMsg(''); setUploadProgress('')

    try {
      const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
      const apiKey = process.env.NEXT_PUBLIC_APTOS_API_KEY || ''

      // ── Step 1: Upload documents from browser using publisher's wallet ──────
      const documentReceipts: (BrowserUploadResult & { originalName: string })[] = []
      for (const doc of docs) {
        setUploadProgress(`Uploading ${doc.file.name} to Shelby… (${docs.indexOf(doc) + 1}/${docs.length})`)
        const onProgress = (p: BrowserUploadProgress) => setUploadProgress(p.message)
        const receipt = await uploadFileFromBrowser(
          doc.file,
          address,
          signAndSubmitTransaction,
          apiKey,
          onProgress
        )
        documentReceipts.push({ ...receipt, originalName: doc.file.name })
      }

      // ── Step 2: Upload article JSON from browser using publisher's wallet ───
      setUploadProgress('Archiving article to Shelby…')
      const articleContent = JSON.stringify({
        slug, title: form.title, excerpt: form.excerpt, body: form.body,
        contentType: form.contentType,
        tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        priceView: parseFloat(form.priceView),
        priceCite: parseFloat(form.priceCite),
        priceLicense: parseFloat(form.priceLicense),
        publisherAddress: address,
        publishedAt: Date.now(),
      })
      const articleFile = new File([articleContent], `${slug}.json`, { type: 'application/json' })
      const onArticleProgress = (p: BrowserUploadProgress) => setUploadProgress(p.message)
      const articleReceipt = await uploadFileFromBrowser(
        articleFile,
        address,
        signAndSubmitTransaction,
        apiKey,
        onArticleProgress
      )

      // ── Step 3: Save receipt to our backend (no Shelby calls server-side) ───
      setUploadProgress('Saving to The Record database…')
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer dashboard',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          article: {
            slug, title: form.title, excerpt: form.excerpt, body: form.body,
            contentType: form.contentType,
            tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
            priceView: parseFloat(form.priceView),
            priceCite: parseFloat(form.priceCite),
            priceLicense: parseFloat(form.priceLicense),
            publisherAddress: address,
          },
          articleReceipt,
          documentReceipts,
        }),
      })

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Save failed' }))
        throw new Error(error)
      }

      setPublishedSlug(slug)
      setStatus('success')
      setForm(EMPTY_FORM); setDocs([]); setPublishStep('write'); setUploadProgress('')
    } catch (err: any) {
      setErrorMsg(err?.message || 'Something went wrong')
      setStatus('error')
      setUploadProgress('')
    }
  }

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <main className={styles.page}>
        <header className={styles.topBar}><h1 className={styles.title}>Publisher Dashboard</h1></header>
        <div className={styles.gateState}>
          <div className={styles.gateIcon}>⬡</div>
          <h2 className={styles.gateHeading}>Connect your wallet to publish</h2>
          <p className={styles.gateBody}>Your wallet is your publisher identity on The Record. Connect to access your dashboard.</p>
          <button className={styles.connectBtn} onClick={open}>Connect Wallet →</button>
        </div>
      </main>
    )
  }

  if (publisherStatus === 'loading') {
    return (
      <main className={styles.page}>
        <header className={styles.topBar}><h1 className={styles.title}>Publisher Dashboard</h1></header>
        <div className={styles.gateState}>
          <div className={styles.spinner} style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p className={styles.gateBody}>Checking publisher status…</p>
        </div>
      </main>
    )
  }

  if (publisherStatus === 'none') {
    return (
      <main className={styles.page}>
        <header className={styles.topBar}>
          <h1 className={styles.title}>Publisher Dashboard</h1>
          <span className={styles.connectedAddr}>⬡ {shortAddr}</span>
        </header>
        <div className={styles.gateState}>
          <div className={styles.gateIcon}>◈</div>
          <h2 className={styles.gateHeading}>You're not a publisher yet</h2>
          <p className={styles.gateBody}>Publishing on The Record is by application. Submit your work samples and we'll review your application.</p>
          <a href="/publish" className={styles.connectBtn}>Apply to Publish →</a>
        </div>
      </main>
    )
  }

  if (publisherStatus === 'pending') {
    return (
      <main className={styles.page}>
        <header className={styles.topBar}>
          <h1 className={styles.title}>Publisher Dashboard</h1>
          <span className={styles.connectedAddr}>⬡ {shortAddr}</span>
        </header>
        <div className={styles.gateState}>
          <div className={styles.pendingIcon}>⏳</div>
          <h2 className={styles.gateHeading}>Application under review</h2>
          <p className={styles.gateBody}>Your application has been received. We review every submission personally and will reach out within 5–7 days.</p>
          <div className={styles.pendingAddr}>
            <span className={styles.pendingAddrLabel}>Your wallet</span>
            <span className={styles.pendingAddrValue}>{address}</span>
          </div>
          <p className={styles.pendingNote}>Once approved, your wallet will be whitelisted and you'll have full dashboard access.</p>
        </div>
      </main>
    )
  }

  if (status === 'success') {
    return (
      <main className={styles.page}>
        <header className={styles.topBar}><h1 className={styles.title}>Publisher Dashboard</h1></header>
        <div className={styles.successState}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.successHeading}>Record published.</h2>
          <p className={styles.successBody}>Your record has been uploaded to Shelby and committed to the Aptos blockchain. Permanently archived.</p>
          <div className={styles.successActions}>
            <a href={`/records/${publishedSlug}`} className={styles.viewBtn}>View Record →</a>
            <button className={styles.newBtn} onClick={() => { setStatus('idle'); setView('new-record') }}>Publish Another</button>
          </div>
        </div>
      </main>
    )
  }

  // ── Approved publisher dashboard ───────────────────────────────────────────
  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <h1 className={styles.title}>Publisher Dashboard</h1>
        <div className={styles.topBarRight}>
          <span className={styles.connectedAddr}>⬡ {shortAddr}</span>
        </div>
      </header>

      <div className={styles.tabs}>
        {([['overview','Overview'],['new-record','New Record'],['my-records','My Records']] as [View,string][]).map(([id, label]) => (
          <button key={id} className={`${styles.tab} ${view === id ? styles.tabActive : ''}`}
            onClick={() => { setView(id); if (id === 'my-records') loadMyRecords() }}>
            {label}
          </button>
        ))}
      </div>

      {view === 'overview' && (
        <div className={styles.content}>
          <div className={styles.statsGrid}>
            {[['0','Records published'],['$0.00','Total earned'],['0','Licenses sold'],['0','Total views']].map(([n,l]) => (
              <div key={l} className={styles.statCard}>
                <span className={styles.statNum}>{n}</span>
                <span className={styles.statLabel}>{l}</span>
              </div>
            ))}
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
                ['01','Write your record','Add a title, body, and excerpt.'],
                ['02','Attach source documents','Upload PDFs, spreadsheets, images.'],
                ['03','Set your prices','Choose prices for View, Cite, and License tiers.'],
                ['04','Sign & publish','Your wallet signs the upload. Permanently archived on Aptos.'],
              ].map(([n,t,d]) => (
                <div key={n} className={styles.infoStep}>
                  <span className={styles.infoNum}>{n}</span>
                  <div><strong>{t}</strong><p>{d}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'new-record' && (
        <div className={styles.content}>
          <div className={styles.steps}>
            {(['write','documents','pricing','review'] as PublishStep[]).map((s,i) => {
              const idx = ['write','documents','pricing','review'].indexOf(publishStep)
              return (
                <div key={s} className={`${styles.step} ${publishStep===s?styles.stepActive:''} ${idx>i?styles.stepDone:''}`}>
                  <span className={styles.stepNum}>{i+1}</span>
                  <span className={styles.stepLabel}>{s.charAt(0).toUpperCase()+s.slice(1)}</span>
                </div>
              )
            })}
          </div>

          {publishStep === 'write' && (
            <div className={styles.formSection}>
              <h2 className={styles.formTitle}>Write your record</h2>
              <div className={styles.field}>
                <label className={styles.label}>Title <span className={styles.req}>*</span></label>
                <input className={styles.input} placeholder="e.g. NDDC Shell Companies: Full Fund Flow 2019–2024" value={form.title} onChange={e=>up('title',e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Content type <span className={styles.req}>*</span></label>
                <div className={styles.typeGrid}>
                  {CONTENT_TYPE_LIST.map(ct => (
                    <button key={ct.id} className={`${styles.typeBtn} ${form.contentType===ct.id?styles.typeBtnActive:''}`}
                      style={form.contentType===ct.id?{borderColor:ct.border,background:ct.bg,color:ct.color}:{}}
                      onClick={()=>up('contentType',ct.id)}>{ct.icon} {ct.label}</button>
                  ))}
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Excerpt <span className={styles.req}>*</span></label>
                <span className={styles.hint}>2–3 sentences. Shown in feed and cards.</span>
                <textarea className={styles.textarea} rows={3} placeholder="What this record reveals..." value={form.excerpt} onChange={e=>up('excerpt',e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Body <span className={styles.req}>*</span></label>
                <span className={styles.hint}>Full record content. Markdown supported.</span>
                <textarea className={styles.textarea} rows={16} placeholder={`## Summary\n\nWrite your full record here...\n\n## Evidence\n\n...`} value={form.body} onChange={e=>up('body',e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Tags</label>
                <span className={styles.hint}>Comma-separated. e.g. nigeria, corruption, NDDC</span>
                <input className={styles.input} placeholder="tag1, tag2, tag3" value={form.tags} onChange={e=>up('tags',e.target.value)} />
              </div>
              <div className={styles.formNav}>
                <div />
                <button className={styles.nextBtn} onClick={()=>setPublishStep('documents')} disabled={!form.title||!form.contentType||!form.excerpt||!form.body}>Continue →</button>
              </div>
            </div>
          )}

          {publishStep === 'documents' && (
            <div className={styles.formSection}>
              <h2 className={styles.formTitle}>Attach source documents</h2>
              <p className={styles.formSub}>PDFs, spreadsheets, images — any supporting evidence. Optional but recommended.</p>
              <div className={styles.dropzone} onClick={()=>fileInputRef.current?.click()}
                onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();addDocs(e.dataTransfer.files)}}>
                <span className={styles.dropzoneIcon}>⊕</span>
                <span className={styles.dropzoneText}>Click to upload or drag files here</span>
                <span className={styles.dropzoneHint}>PDF, DOCX, XLSX, PNG, JPG — max 50MB each</span>
              </div>
              <input ref={fileInputRef} type="file" multiple style={{display:'none'}} onChange={e=>addDocs(e.target.files)} />
              {docs.length > 0 && (
                <div className={styles.docList}>
                  {docs.map(doc => (
                    <div key={doc.id} className={styles.docItem}>
                      <span className={styles.docIcon}>📄</span>
                      <span className={styles.docName}>{doc.file.name}</span>
                      <span className={styles.docSize}>{(doc.file.size/1024).toFixed(0)} KB</span>
                      <button className={styles.docRemove} onClick={()=>removeDoc(doc.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.formNav}>
                <button className={styles.backBtn} onClick={()=>setPublishStep('write')}>← Back</button>
                <button className={styles.nextBtn} onClick={()=>setPublishStep('pricing')}>Continue →</button>
              </div>
            </div>
          )}

          {publishStep === 'pricing' && (
            <div className={styles.formSection}>
              <h2 className={styles.formTitle}>Set your prices</h2>
              <p className={styles.formSub}>Readers pay in APT. Prices shown in USD equivalent.</p>
              <div className={styles.pricingGrid}>
                {[
                  {tier:'View',key:'priceView' as const,desc:'48h read-only access, watermarked',suggested:'$5'},
                  {tier:'Cite',key:'priceCite' as const,desc:'Permanent citation rights + signed PDF',suggested:'$19'},
                  {tier:'License',key:'priceLicense' as const,desc:'Full download + Certificate of Authenticity',suggested:'$99'},
                ].map(({tier,key,desc,suggested})=>(
                  <div key={tier} className={styles.priceCard}>
                    <div className={styles.priceCardTop}><span className={styles.priceTier}>{tier}</span><span className={styles.priceSuggested}>Suggested: {suggested}</span></div>
                    <p className={styles.priceDesc}>{desc}</p>
                    <div className={styles.priceInputWrap}>
                      <span className={styles.priceCurrency}>$</span>
                      <input className={styles.priceInput} type="number" min="0" step="0.01" value={form[key]} onChange={e=>up(key,e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.institutionalNote}><span>⚖</span><span>Institutional tier pricing is handled by custom contract after publish.</span></div>
              <div className={styles.formNav}>
                <button className={styles.backBtn} onClick={()=>setPublishStep('documents')}>← Back</button>
                <button className={styles.nextBtn} onClick={()=>setPublishStep('review')}>Review →</button>
              </div>
            </div>
          )}

          {publishStep === 'review' && (
            <div className={styles.formSection}>
              <h2 className={styles.formTitle}>Review & publish</h2>
              <p className={styles.formSub}>Once published, this record is permanently archived on-chain and cannot be deleted.</p>
              <div className={styles.reviewCard}>
                {[
                  ['Title',form.title],
                  ['Type',form.contentType],
                  ['Documents',`${docs.length} file${docs.length!==1?'s':''}`],
                  ['Pricing',`View $${form.priceView} · Cite $${form.priceCite} · License $${form.priceLicense}`],
                  ['Publisher',shortAddr],
                ].map(([l,v])=>(
                  <div key={l} className={styles.reviewRow}><span className={styles.reviewLabel}>{l}</span><span className={styles.reviewValue} style={l==='Publisher'?{fontFamily:'var(--font-mono)',fontSize:'11px'}:{}}>{v}</span></div>
                ))}
              </div>
              <div className={styles.chainInfo}>
                <span className={styles.chainIcon}>⛓</span>
                <div>
                  <strong>What happens when you publish:</strong>
                  <ol className={styles.chainSteps}>
                    <li>Your wallet signs the upload directly — you own this record</li>
                    <li>Files uploaded to Shelby Protocol (decentralised storage)</li>
                    <li>Content hash committed to Aptos blockchain</li>
                    <li>Record saved to The Record database and live immediately</li>
                  </ol>
                </div>
              </div>
              {status === 'error' && <div className={styles.errorBox}>⚠ {errorMsg}</div>}
              {status === 'uploading' && uploadProgress && (
                <div className={styles.progressBox}>⛓ {uploadProgress}</div>
              )}
              <div className={styles.formNav}>
                <button className={styles.backBtn} onClick={()=>setPublishStep('pricing')}>← Back</button>
                <button className={styles.publishBtn} onClick={handlePublish} disabled={status==='uploading'}>
                  {status==='uploading'?<><span className={styles.spinner}/> Publishing to chain…</>:'Publish Record →'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'my-records' && (
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>My Records</h2>
          {loadingRecords ? (
            <div className={styles.loading}>Loading records…</div>
          ) : myRecords.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>◈</span>
              <p>No records published yet.</p>
              <button className={styles.newBtn} onClick={()=>setView('new-record')}>Publish your first record →</button>
            </div>
          ) : (
            <div className={styles.recordsList}>
              {myRecords.map((r:any) => (
                <div key={r.id} className={styles.recordRow}>
                  <div className={styles.recordRowLeft}>
                    <span className={styles.recordTitle}>{r.title}</span>
                    <div className={styles.recordMeta}>
                      <span>{r.content_type}</span><span>·</span>
                      <span>{new Date(r.published_at).toLocaleDateString()}</span><span>·</span>
                      <span>{r.view_count} views</span>
                    </div>
                  </div>
                  <div className={styles.recordRowRight}>
                    <span className={r.blob_name?styles.badgeLive:styles.badgeDraft}>{r.blob_name?'Live':'Draft'}</span>
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
