'use client'

import { useState, useEffect } from 'react'
import styles from './admin.module.css'

type AdminView = 'applications' | 'publishers' | 'records'

interface Application {
  id: string
  name: string
  email: string
  twitter_handle: string | null
  country: string | null
  creator_type: string
  content_types: string[]
  sample_url_1: string | null
  sample_url_2: string | null
  bio: string
  content_plan: string
  wallet_ready: string | null
  aptos_address: string | null
  status: string
  submitted_at: string
  reviewer_note: string | null
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [view, setView] = useState<AdminView>('applications')
  const [applications, setApplications] = useState<Application[]>([])
  const [publishers, setPublishers] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Application | null>(null)
  const [approveAddress, setApproveAddress] = useState('')
  const [approveHandle, setApproveHandle] = useState('')
  const [approving, setApproving] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  const login = () => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'therecord-admin') {
      setAuthed(true)
      setAuthError('')
    } else {
      fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      }).then(r => {
        if (r.ok) { setAuthed(true); setAuthError('') }
        else setAuthError('Wrong password')
      }).catch(() => setAuthError('Wrong password'))
    }
  }

  const load = async (v: AdminView) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/${v}`, {
        headers: { 'x-admin-password': password }
      })
      if (!res.ok) { setAuthed(false); return }
      const data = await res.json()
      if (v === 'applications') setApplications(data.applications || [])
      if (v === 'publishers') setPublishers(data.publishers || [])
      if (v === 'records') setRecords(data.records || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (authed) load(view)
  }, [authed, view])

  const approve = async (app: Application) => {
    setApproving(true); setActionMsg('')
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({
          applicationId: app.id,
          aptosAddress: approveAddress || app.aptos_address,
          handle: approveHandle || app.twitter_handle?.replace('@','') || app.name.toLowerCase().replace(/\s+/g,'-'),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setActionMsg('✓ Approved and publisher created')
        setSelected(null)
        load('applications')
      } else {
        setActionMsg(`✗ ${data.error}`)
      }
    } catch { setActionMsg('✗ Request failed') }
    setApproving(false)
  }

  const reject = async (id: string) => {
    if (!confirm('Reject this application?')) return
    await fetch('/api/admin/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ applicationId: id }),
    })
    load('applications')
  }

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <main className={styles.page}>
        <div className={styles.authGate}>
          <div className={styles.authIcon}>⬡</div>
          <h1 className={styles.authTitle}>Admin</h1>
          <p className={styles.authSub}>The Record — internal access only</p>
          <input
            className={styles.authInput}
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            autoFocus
          />
          {authError && <p className={styles.authError}>{authError}</p>}
          <button className={styles.authBtn} onClick={login}>Enter →</button>
        </div>
      </main>
    )
  }

  const pending = applications.filter(a => a.status === 'pending')
  const approved = applications.filter(a => a.status === 'approved')
  const rejected = applications.filter(a => a.status === 'rejected')

  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <span className={styles.logo}>⬡</span>
          <h1 className={styles.title}>The Record — Admin</h1>
        </div>
        <div className={styles.topBarRight}>
          {pending.length > 0 && <span className={styles.badge}>{pending.length} pending</span>}
          <button className={styles.logoutBtn} onClick={() => setAuthed(false)}>Sign out</button>
        </div>
      </header>

      <div className={styles.tabs}>
        {(['applications','publishers','records'] as AdminView[]).map(v => (
          <button key={v} className={`${styles.tab} ${view===v?styles.tabActive:''}`} onClick={()=>setView(v)}>
            {v.charAt(0).toUpperCase()+v.slice(1)}
            {v==='applications' && pending.length > 0 && <span className={styles.tabBadge}>{pending.length}</span>}
          </button>
        ))}
      </div>

      {actionMsg && (
        <div className={`${styles.actionMsg} ${actionMsg.startsWith('✓')?styles.actionMsgOk:styles.actionMsgErr}`}>
          {actionMsg}
          <button onClick={()=>setActionMsg('')}>✕</button>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : (
        <div className={styles.content}>

          {/* ── APPLICATIONS ── */}
          {view === 'applications' && (
            <div>
              {pending.length === 0 && approved.length === 0 && rejected.length === 0 && (
                <div className={styles.empty}>No applications yet.</div>
              )}

              {pending.length > 0 && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Pending ({pending.length})</h2>
                  {pending.map(app => (
                    <div key={app.id} className={`${styles.appCard} ${styles.appCardPending}`}>
                      <div className={styles.appCardTop}>
                        <div className={styles.appInfo}>
                          <span className={styles.appName}>{app.name}</span>
                          <span className={styles.appMeta}>{app.email} · {app.country} · {app.creator_type}</span>
                          <span className={styles.appMeta}>{new Date(app.submitted_at).toLocaleDateString()}</span>
                        </div>
                        <div className={styles.appActions}>
                          <button className={styles.viewBtn2} onClick={() => { setSelected(app); setApproveAddress(app.aptos_address||''); setApproveHandle(app.twitter_handle?.replace('@','')||'') }}>
                            Review
                          </button>
                        </div>
                      </div>
                      <p className={styles.appExcerpt}>{app.bio}</p>
                      <div className={styles.appLinks}>
                        {app.sample_url_1 && <a href={app.sample_url_1} target="_blank" rel="noopener noreferrer" className={styles.appLink}>Sample 1 ↗</a>}
                        {app.sample_url_2 && <a href={app.sample_url_2} target="_blank" rel="noopener noreferrer" className={styles.appLink}>Sample 2 ↗</a>}
                        {app.content_types.map(t => <span key={t} className={styles.appTag}>{t}</span>)}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {approved.length > 0 && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Approved ({approved.length})</h2>
                  {approved.map(app => (
                    <div key={app.id} className={`${styles.appCard} ${styles.appCardApproved}`}>
                      <div className={styles.appCardTop}>
                        <div className={styles.appInfo}>
                          <span className={styles.appName}>{app.name}</span>
                          <span className={styles.appMeta}>{app.email} · {app.creator_type}</span>
                        </div>
                        <span className={styles.statusBadgeApproved}>Approved</span>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {rejected.length > 0 && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Rejected ({rejected.length})</h2>
                  {rejected.map(app => (
                    <div key={app.id} className={`${styles.appCard} ${styles.appCardRejected}`}>
                      <div className={styles.appCardTop}>
                        <div className={styles.appInfo}>
                          <span className={styles.appName}>{app.name}</span>
                          <span className={styles.appMeta}>{app.email}</span>
                        </div>
                        <span className={styles.statusBadgeRejected}>Rejected</span>
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </div>
          )}

          {/* ── PUBLISHERS ── */}
          {view === 'publishers' && (
            <div>
              {publishers.length === 0 ? (
                <div className={styles.empty}>No publishers yet.</div>
              ) : (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Publishers ({publishers.length})</h2>
                  {publishers.map((p:any) => (
                    <div key={p.id} className={styles.pubCard}>
                      <div className={styles.pubInfo}>
                        <span className={styles.pubName}>{p.name}</span>
                        <span className={styles.pubMeta}>@{p.handle}</span>
                        {p.aptos_address && <span className={styles.pubAddr}>{p.aptos_address.slice(0,16)}…</span>}
                      </div>
                      <span className={`${styles.statusBadgeApproved}`}>{p.verified?'Verified':'Active'}</span>
                    </div>
                  ))}
                </section>
              )}
            </div>
          )}

          {/* ── RECORDS ── */}
          {view === 'records' && (
            <div>
              {records.length === 0 ? (
                <div className={styles.empty}>No records published yet.</div>
              ) : (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Records ({records.length})</h2>
                  {records.map((r:any) => (
                    <div key={r.id} className={styles.recCard}>
                      <div className={styles.recInfo}>
                        <span className={styles.recTitle}>{r.title}</span>
                        <span className={styles.recMeta}>{r.content_type} · {r.publisher_name} · {new Date(r.published_at).toLocaleDateString()}</span>
                        {r.aptos_tx_hash && <span className={styles.recHash}>{r.aptos_tx_hash.slice(0,20)}…</span>}
                      </div>
                      <div className={styles.recRight}>
                        <span className={r.blob_name?styles.statusBadgeApproved:styles.statusBadgePending}>{r.blob_name?'On-chain':'Draft'}</span>
                        <a href={`/records/${r.slug}`} target="_blank" rel="noopener noreferrer" className={styles.recLink}>View ↗</a>
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── REVIEW MODAL ── */}
      {selected && (
        <div className={styles.modalOverlay} onClick={()=>setSelected(null)}>
          <div className={styles.modal} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Review Application</h2>
              <button className={styles.modalClose} onClick={()=>setSelected(null)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalRow}><span className={styles.modalLabel}>Name</span><span>{selected.name}</span></div>
              <div className={styles.modalRow}><span className={styles.modalLabel}>Email</span><span>{selected.email}</span></div>
              <div className={styles.modalRow}><span className={styles.modalLabel}>Type</span><span>{selected.creator_type}</span></div>
              <div className={styles.modalRow}><span className={styles.modalLabel}>Country</span><span>{selected.country || '—'}</span></div>
              <div className={styles.modalRow}><span className={styles.modalLabel}>Content</span><span>{selected.content_types.join(', ')}</span></div>
              <div className={styles.modalRow}><span className={styles.modalLabel}>Wallet?</span><span>{selected.wallet_ready || '—'}</span></div>

              {selected.sample_url_1 && (
                <div className={styles.modalRow}><span className={styles.modalLabel}>Sample 1</span><a href={selected.sample_url_1} target="_blank" rel="noopener noreferrer" className={styles.modalLink}>{selected.sample_url_1} ↗</a></div>
              )}
              {selected.sample_url_2 && (
                <div className={styles.modalRow}><span className={styles.modalLabel}>Sample 2</span><a href={selected.sample_url_2} target="_blank" rel="noopener noreferrer" className={styles.modalLink}>{selected.sample_url_2} ↗</a></div>
              )}

              <div className={styles.modalSection}>
                <span className={styles.modalLabel}>Bio</span>
                <p className={styles.modalText}>{selected.bio}</p>
              </div>

              <div className={styles.modalSection}>
                <span className={styles.modalLabel}>Content plan</span>
                <p className={styles.modalText}>{selected.content_plan}</p>
              </div>

              <div className={styles.modalDivider} />

              <div className={styles.modalSection}>
                <span className={styles.modalLabel}>Aptos wallet address to whitelist</span>
                <span className={styles.modalHint}>Required for approval — this wallet gets publisher access</span>
                <input
                  className={styles.modalInput}
                  placeholder="0x..."
                  value={approveAddress}
                  onChange={e=>setApproveAddress(e.target.value)}
                />
              </div>

              <div className={styles.modalSection}>
                <span className={styles.modalLabel}>Publisher handle</span>
                <span className={styles.modalHint}>Their public username on The Record</span>
                <input
                  className={styles.modalInput}
                  placeholder="e.g. zachonchain"
                  value={approveHandle}
                  onChange={e=>setApproveHandle(e.target.value)}
                />
              </div>

              {actionMsg && (
                <div className={`${styles.actionMsg} ${actionMsg.startsWith('✓')?styles.actionMsgOk:styles.actionMsgErr}`}>
                  {actionMsg}
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.rejectBtn} onClick={()=>{ reject(selected.id); setSelected(null) }}>Reject</button>
              <button
                className={styles.approveBtn}
                onClick={()=>approve(selected)}
                disabled={!approveAddress || approving}
              >
                {approving ? 'Approving…' : 'Approve & Whitelist Wallet →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
