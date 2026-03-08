'use client'

import { useState, useRef } from 'react'
import type { Article } from './DashboardShell'
import styles from './ArticleEditor.module.css'

type EditorTab = 'write' | 'documents' | 'settings' | 'publish'
type PublishStatus = 'idle' | 'uploading' | 'hashing' | 'committing' | 'done' | 'error'

interface UploadedDoc {
  id: string
  name: string
  size: string
  type: string
  hash: string
  status: 'uploading' | 'hashed' | 'committed'
}

interface Props {
  article?: Article
  onBack: () => void
}

export default function ArticleEditor({ article, onBack }: Props) {
  const [tab, setTab] = useState<EditorTab>('write')
  const [title, setTitle] = useState(article?.title ?? '')
  const [body, setBody] = useState('')
  const [accessModel, setAccessModel] = useState<Article['accessModel']>(article?.accessModel ?? 'free')
  const [price, setPrice] = useState(article?.price ?? '')
  const [timelockDate, setTimelockDate] = useState('')
  const [timelockEnabled, setTimelockEnabled] = useState(false)
  const [docs, setDocs] = useState<UploadedDoc[]>([])
  const [publishStatus, setPublishStatus] = useState<PublishStatus>('idle')
  const [savedStatus, setSavedStatus] = useState<'saved' | 'saving' | 'unsaved'>('unsaved')
  const fileRef = useRef<HTMLInputElement>(null)

  const isEdit = !!article
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length

  // Simulate autosave
  const handleBodyChange = (val: string) => {
    setBody(val)
    setSavedStatus('saving')
    setTimeout(() => setSavedStatus('saved'), 1200)
  }

  // Simulate file upload + hash
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((file) => {
      const id = Math.random().toString(36).slice(2)
      const fakeHash = Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')

      const doc: UploadedDoc = {
        id,
        name: file.name,
        size: formatBytes(file.size),
        type: file.type || 'application/octet-stream',
        hash: `sha256:${fakeHash}...`,
        status: 'uploading',
      }

      setDocs((prev) => [...prev, doc])

      // Simulate upload → hash → commit sequence
      setTimeout(() => {
        setDocs((prev) =>
          prev.map((d) => d.id === id ? { ...d, status: 'hashed' } : d)
        )
      }, 1200)
      setTimeout(() => {
        setDocs((prev) =>
          prev.map((d) => d.id === id ? { ...d, status: 'committed' } : d)
        )
      }, 2600)
    })
  }

  const removeDoc = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id))
  }

  // Simulate publish sequence
  const handlePublish = async () => {
    setTab('publish')
    setPublishStatus('uploading')
    await delay(1400)
    setPublishStatus('hashing')
    await delay(1200)
    setPublishStatus('committing')
    await delay(1600)
    setPublishStatus('done')
  }

  const TABS: { id: EditorTab; label: string }[] = [
    { id: 'write',     label: 'Write' },
    { id: 'documents', label: `Documents${docs.length ? ` (${docs.length})` : ''}` },
    { id: 'settings',  label: 'Settings' },
    { id: 'publish',   label: 'Publish' },
  ]

  return (
    <div className={styles.editor}>
      {/* Editor header */}
      <div className={styles.editorHeader}>
        <button className={styles.backBtn} onClick={onBack}>
          ← Back to overview
        </button>
        <div className={styles.headerCenter}>
          <div className={styles.titlePreview}>
            {title || <span className={styles.titlePlaceholder}>Untitled article</span>}
          </div>
          <div className={`${styles.saveStatus} ${styles[savedStatus]}`}>
            {savedStatus === 'saving' && '● Saving…'}
            {savedStatus === 'saved' && '✓ Saved'}
            {savedStatus === 'unsaved' && '○ Unsaved'}
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.saveDraftBtn} onClick={() => setSavedStatus('saved')}>
            Save draft
          </button>
          <button
            className={styles.publishBtn}
            onClick={handlePublish}
            disabled={!title.trim() || publishStatus === 'done'}
          >
            {publishStatus === 'done' ? '✓ Published' : 'Publish →'}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className={styles.tabBar}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        <div className={styles.tabBarRight}>
          <span className={styles.wordCount}>{wordCount.toLocaleString()} words</span>
        </div>
      </div>

      {/* ── WRITE TAB ── */}
      {tab === 'write' && (
        <div className={styles.writePane}>
          <input
            type="text"
            className={styles.titleInput}
            placeholder="Article headline…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className={styles.byline}>
            <span>By Fisayo Ogunleye</span>
            <span className={styles.dot}>·</span>
            <span>{new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <textarea
            className={styles.bodyInput}
            placeholder={`Start writing your investigation here…\n\nTip: Attach source documents in the Documents tab — each one gets a tamper-evident hash committed to Aptos automatically.`}
            value={body}
            onChange={(e) => handleBodyChange(e.target.value)}
          />
        </div>
      )}

      {/* ── DOCUMENTS TAB ── */}
      {tab === 'documents' && (
        <div className={styles.docsPane}>
          <div className={styles.docsPaneHeader}>
            <div>
              <h2 className={styles.paneTitle}>Source Documents</h2>
              <p className={styles.paneSubtitle}>
                Every document you attach is stored on Shelby Protocol and gets a
                cryptographic hash committed to Aptos. Readers can verify any document
                hasn't been altered since you uploaded it.
              </p>
            </div>
          </div>

          {/* Drop zone */}
          <div
            className={styles.dropZone}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              handleFileSelect(e.dataTransfer.files)
            }}
          >
            <input
              ref={fileRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files)}
              accept=".pdf,.doc,.docx,.csv,.xlsx,.png,.jpg,.mp3,.mp4"
            />
            <div className={styles.dropZoneIcon}>📎</div>
            <div className={styles.dropZoneText}>
              Drop files here or <span>click to browse</span>
            </div>
            <div className={styles.dropZoneHint}>
              PDFs, documents, images, audio, video · Max 500MB each
            </div>
          </div>

          {/* Uploaded docs */}
          {docs.length > 0 && (
            <div className={styles.docList}>
              {docs.map((doc) => (
                <div key={doc.id} className={styles.docRow}>
                  <div className={styles.docIcon}>{getFileIcon(doc.type)}</div>
                  <div className={styles.docInfo}>
                    <div className={styles.docName}>{doc.name}</div>
                    <div className={styles.docMeta}>
                      {doc.size}
                      {doc.status !== 'uploading' && (
                        <>
                          <span className={styles.dot}>·</span>
                          <span className={styles.docHash}>{doc.hash}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={styles.docStatus}>
                    {doc.status === 'uploading' && (
                      <span className={styles.statusUploading}>
                        <span className={styles.spinner} /> Uploading…
                      </span>
                    )}
                    {doc.status === 'hashed' && (
                      <span className={styles.statusHashed}>
                        <span className={styles.spinnerGreen} /> Committing to Aptos…
                      </span>
                    )}
                    {doc.status === 'committed' && (
                      <span className={styles.statusCommitted}>
                        <span className={styles.commitDot} /> On-Chain ✓
                      </span>
                    )}
                  </div>
                  <button
                    className={styles.docRemove}
                    onClick={() => removeDoc(doc.id)}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {docs.length === 0 && (
            <div className={styles.docsEmpty}>
              No documents attached yet. Drop files above to add source documents.
            </div>
          )}

          {/* Archive search prompt */}
          <div className={styles.archivePrompt}>
            <div className={styles.archivePromptIcon}>⊟</div>
            <div>
              <div className={styles.archivePromptTitle}>Search the government archive</div>
              <p className={styles.archivePromptBody}>
                Find INEC results, BPP procurement records, EFCC filings, and CBN circulars
                to use as source documents — already archived and hash-verified.
              </p>
            </div>
            <a href="/archive" className={styles.archivePromptBtn} target="_blank" rel="noreferrer">
              Open archive →
            </a>
          </div>
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {tab === 'settings' && (
        <div className={styles.settingsPane}>
          <h2 className={styles.paneTitle}>Article Settings</h2>
          <p className={styles.paneSubtitle}>
            Configure how readers access and pay for this article.
          </p>

          <div className={styles.settingsSections}>
            {/* Access model */}
            <div className={styles.settingsBlock}>
              <div className={styles.settingsBlockTitle}>Access Model</div>
              <div className={styles.accessGrid}>
                {([
                  { value: 'free',             label: 'Free',             desc: 'Anyone can read. Build audience.' },
                  { value: 'pay-per-article',  label: 'Pay-per-article',  desc: 'Readers pay once per article.' },
                  { value: 'subscription',     label: 'Subscribers only', desc: 'Your subscribers get full access.' },
                ] as const).map((opt) => (
                  <label
                    key={opt.value}
                    className={`${styles.accessOption} ${accessModel === opt.value ? styles.accessOptionSelected : ''}`}
                  >
                    <input
                      type="radio"
                      name="access"
                      value={opt.value}
                      checked={accessModel === opt.value}
                      onChange={() => setAccessModel(opt.value)}
                    />
                    <div className={styles.accessOptionLabel}>{opt.label}</div>
                    <div className={styles.accessOptionDesc}>{opt.desc}</div>
                  </label>
                ))}
              </div>

              {accessModel === 'pay-per-article' && (
                <div className={styles.priceField}>
                  <label className={styles.fieldLabel}>Price (₦)</label>
                  <div className={styles.priceInput}>
                    <span className={styles.pricePrefix}>₦</span>
                    <input
                      type="number"
                      className={styles.priceInputField}
                      placeholder="500"
                      value={price.replace('₦', '')}
                      onChange={(e) => setPrice(`₦${e.target.value}`)}
                      min="100"
                    />
                  </div>
                  <div className={styles.fieldHint}>
                    Minimum ₦100. You receive 100% — no platform fee.
                  </div>
                </div>
              )}
            </div>

            {/* Dead man's switch */}
            <div className={styles.settingsBlock}>
              <div className={styles.settingsBlockTitle}>
                Dead Man's Switch
                <span className={styles.settingsBadge}>Advanced</span>
              </div>
              <p className={styles.settingsBlockBody}>
                Schedule a future date on which this article automatically becomes
                publicly readable — regardless of what happens to your account
                or this platform.
              </p>
              <label className={styles.toggleRow}>
                <div
                  className={`${styles.toggle} ${timelockEnabled ? styles.toggleOn : ''}`}
                  onClick={() => setTimelockEnabled((v) => !v)}
                  role="switch"
                  aria-checked={timelockEnabled}
                  tabIndex={0}
                >
                  <span className={styles.toggleKnob} />
                </div>
                <span className={styles.toggleLabel}>
                  {timelockEnabled ? 'Enabled — article unlocks on set date' : 'Disabled'}
                </span>
              </label>
              {timelockEnabled && (
                <div className={styles.timelockField}>
                  <label className={styles.fieldLabel}>Unlock date & time (WAT)</label>
                  <input
                    type="datetime-local"
                    className={styles.dateInput}
                    value={timelockDate}
                    onChange={(e) => setTimelockDate(e.target.value)}
                  />
                  <div className={styles.fieldHint}>
                    This date is encoded into the Aptos smart contract.
                    It cannot be changed after publishing.
                  </div>
                </div>
              )}
            </div>

            {/* Excerpt / SEO */}
            <div className={styles.settingsBlock}>
              <div className={styles.settingsBlockTitle}>Excerpt</div>
              <p className={styles.settingsBlockBody}>
                A short summary shown on the investigations feed and in social previews.
              </p>
              <textarea
                className={styles.excerptInput}
                rows={3}
                placeholder="A 2–3 sentence summary of what this investigation reveals…"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── PUBLISH TAB ── */}
      {tab === 'publish' && (
        <div className={styles.publishPane}>
          {publishStatus === 'idle' && (
            <div className={styles.publishIdle}>
              <h2 className={styles.paneTitle}>Ready to publish?</h2>
              <p className={styles.paneSubtitle}>
                Review your article before sending it to the chain.
              </p>

              <div className={styles.publishChecklist}>
                <CheckItem
                  done={title.trim().length > 0}
                  label="Article has a headline"
                  sub={title || 'Add a headline in the Write tab'}
                />
                <CheckItem
                  done={wordCount >= 100}
                  label="Article body is at least 100 words"
                  sub={`${wordCount} words written`}
                />
                <CheckItem
                  done={docs.length > 0}
                  label="Source documents attached"
                  sub={docs.length > 0 ? `${docs.length} document${docs.length !== 1 ? 's' : ''} attached` : 'Optional but strongly recommended'}
                  optional
                />
                <CheckItem
                  done={accessModel !== null}
                  label="Access model configured"
                  sub={`${accessModel}${price ? ` · ${price}` : ''}`}
                />
              </div>

              <button
                className={styles.publishNowBtn}
                onClick={handlePublish}
                disabled={!title.trim()}
              >
                Publish to The Record →
              </button>
            </div>
          )}

          {(publishStatus === 'uploading' || publishStatus === 'hashing' || publishStatus === 'committing') && (
            <div className={styles.publishProgress}>
              <div className={styles.publishSpinner} />
              <h2 className={styles.publishProgressTitle}>Publishing…</h2>
              <div className={styles.publishSteps}>
                {(() => {
                  const s = publishStatus as string
                  return (
                    <>
                      <PublishStep
                        label="Uploading article to Shelby Protocol"
                        status={s === 'uploading' ? 'active' : 'done'}
                      />
                      <PublishStep
                        label="Generating cryptographic hash"
                        status={s === 'uploading' ? 'pending' : s === 'hashing' ? 'active' : 'done'}
                      />
                      <PublishStep
                        label="Committing hash to Aptos blockchain"
                        status={s === 'committing' ? 'active' : s === 'done' ? 'done' : 'pending'}
                      />
                    </>
                  )
                })()}
              </div>
            </div>
          )}

          {publishStatus === 'done' && (
            <div className={styles.publishDone}>
              <div className={styles.publishDoneIcon}>⛓</div>
              <div className={styles.publishDoneEyebrow}>Published & On-Chain</div>
              <h2 className={styles.publishDoneTitle}>Your article is live.</h2>
              <p className={styles.publishDoneBody}>
                Your investigation is now permanently stored on Shelby Protocol.
                The cryptographic hash has been committed to Aptos — any future
                alteration to your article will be immediately detectable.
              </p>
              <div className={styles.publishDoneHash}>
                <div className={styles.publishDoneHashLabel}>Aptos Transaction Hash</div>
                <div className={styles.publishDoneHashValue}>
                  0x{Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}
                </div>
              </div>
              <div className={styles.publishDoneActions}>
                <a href="/investigations/1" className={styles.viewLiveBtn} target="_blank">
                  View live article ↗
                </a>
                <button className={styles.backToOverviewBtn} onClick={onBack}>
                  Back to overview
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Helpers ── */
function CheckItem({
  done, label, sub, optional,
}: {
  done: boolean; label: string; sub: string; optional?: boolean
}) {
  return (
    <div className={`${styles.checkItem} ${done ? styles.checkItemDone : optional ? styles.checkItemOptional : styles.checkItemPending}`}>
      <div className={styles.checkItemIcon}>
        {done ? '✓' : optional ? '○' : '!'}
      </div>
      <div>
        <div className={styles.checkItemLabel}>{label}</div>
        <div className={styles.checkItemSub}>{sub}</div>
      </div>
    </div>
  )
}

function PublishStep({ label, status }: { label: string; status: 'pending' | 'active' | 'done' }) {
  return (
    <div className={`${styles.publishStep} ${styles[`publishStep_${status}`]}`}>
      <div className={styles.publishStepDot}>
        {status === 'done' && '✓'}
        {status === 'active' && <span className={styles.spinnerDot} />}
        {status === 'pending' && '○'}
      </div>
      <span>{label}</span>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(type: string): string {
  if (type.includes('pdf')) return '📄'
  if (type.includes('image')) return '🖼️'
  if (type.includes('audio')) return '🎵'
  if (type.includes('video')) return '🎬'
  if (type.includes('spreadsheet') || type.includes('csv')) return '📊'
  return '📎'
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
