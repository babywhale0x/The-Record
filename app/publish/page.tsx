'use client'
import { useState } from 'react'
import { CONTENT_TYPE_LIST } from '@/lib/content-types'
import styles from './publish.module.css'

type Step = 1 | 2 | 3
type Status = 'idle' | 'submitting' | 'success'

export default function PublishPage() {
  const [step, setStep] = useState<Step>(1)
  const [status, setStatus] = useState<Status>('idle')
  const [form, setForm] = useState({
    name: '', email: '', handle: '', country: '',
    creatorType: '', contentTypes: [] as string[],
    sampleUrl1: '', sampleUrl2: '', bio: '',
    contentPlan: '', walletReady: '',
  })

  const up = (field: string, val: string) => setForm((p) => ({ ...p, [field]: val }))
  const toggleType = (id: string) =>
    setForm((p) => ({
      ...p,
      contentTypes: p.contentTypes.includes(id)
        ? p.contentTypes.filter((t) => t !== id)
        : [...p.contentTypes, id],
    }))

  const submit = async () => {
    setStatus('submitting')
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Submission failed' }))
        alert(error || 'Submission failed. Please try again.')
        setStatus('idle')
        return
      }
      setStatus('success')
    } catch {
      alert('Network error. Please check your connection and try again.')
      setStatus('idle')
    }
  }

  if (status === 'success') {
    return (
      <main className={styles.page}>
        <header className={styles.topBar}>
          <h1 className={styles.title}>Publish</h1>
        </header>
        <div className={styles.success}>
          <div className={styles.successIcon}>📬</div>
          <h2 className={styles.successHeading}>Application received.</h2>
          <p className={styles.successBody}>
            We review every application personally. You'll hear from us at <strong>{form.email}</strong> within 5–7 days.
          </p>
          <div className={styles.successSteps}>
            {[
              ['01', 'We review your work samples and background'],
              ['02', 'We may reach out with a brief follow-up'],
              ['03', 'On approval, you get access to your publisher dashboard'],
            ].map(([n, t]) => (
              <div key={n} className={styles.successStep}>
                <span className={styles.successNum}>{n}</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <h1 className={styles.title}>Publish</h1>
        <span className={styles.stepIndicator}>Step {step} of 3</span>
      </header>

      <div className={styles.progress}>
        <div className={styles.progressFill} style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      <div className={styles.formWrap}>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Who are you?</h2>
            <p className={styles.stepSub}>Tell us about yourself. Everything is kept confidential until you're approved.</p>

            <div className={styles.fields}>
              <Field label="Display name or pen name" required>
                <input className={styles.input} placeholder="e.g. ZachOnChain" value={form.name} onChange={(e) => up('name', e.target.value)} />
              </Field>
              <Field label="Email address" required>
                <input className={styles.input} type="email" placeholder="your@email.com" value={form.email} onChange={(e) => up('email', e.target.value)} />
              </Field>
              <Field label="Twitter / X handle" hint="Optional but recommended">
                <input className={styles.input} placeholder="@handle" value={form.handle} onChange={(e) => up('handle', e.target.value)} />
              </Field>
              <Field label="Country" required>
                <input className={styles.input} placeholder="e.g. Nigeria" value={form.country} onChange={(e) => up('country', e.target.value)} />
              </Field>
              <Field label="What best describes you?" required>
                <div className={styles.radioGroup}>
                  {[
                    'On-chain investigator',
                    'Investigative journalist',
                    'Researcher / scientist',
                    'Legal archivist / lawyer',
                    'Financial analyst',
                    'Whistleblower / source',
                    'Other',
                  ].map((opt) => (
                    <label key={opt} className={`${styles.radioCard} ${form.creatorType === opt ? styles.radioCardActive : ''}`}>
                      <input type="radio" name="creatorType" checked={form.creatorType === opt} onChange={() => up('creatorType', opt)} />
                      {opt}
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Your work</h2>
            <p className={styles.stepSub}>Show us what you've published. We look at quality, not quantity.</p>
            <div className={styles.fields}>
              <Field label="Content types you'll publish" required>
                <div className={styles.typeGrid}>
                  {CONTENT_TYPE_LIST.map((ct) => (
                    <button
                      key={ct.id}
                      type="button"
                      className={`${styles.typeToggle} ${form.contentTypes.includes(ct.id) ? styles.typeToggleActive : ''}`}
                      style={form.contentTypes.includes(ct.id) ? { borderColor: ct.border, background: ct.bg, color: ct.color } : {}}
                      onClick={() => toggleType(ct.id)}
                    >
                      {ct.icon} {ct.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Work sample URL 1" required hint="A published investigation, paper, report, or thread">
                <input className={styles.input} placeholder="https://" value={form.sampleUrl1} onChange={(e) => up('sampleUrl1', e.target.value)} />
              </Field>
              <Field label="Work sample URL 2" hint="Optional">
                <input className={styles.input} placeholder="https://" value={form.sampleUrl2} onChange={(e) => up('sampleUrl2', e.target.value)} />
              </Field>
              <Field label="Short bio" hint="2–3 sentences about your background">
                <textarea className={styles.textarea} rows={3} placeholder="I'm an independent investigator focused on..." value={form.bio} onChange={(e) => up('bio', e.target.value)} />
              </Field>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>On The Record</h2>
            <p className={styles.stepSub}>What will you publish, and how do you want to get paid?</p>
            <div className={styles.fields}>
              <Field label="What will you publish?" required hint="Describe your first records or ongoing work. 2–4 sentences.">
                <textarea className={styles.textarea} rows={4} placeholder="I plan to publish a series tracing fund flows from the 2024 bridge exploits attributed to state-sponsored actors..." value={form.contentPlan} onChange={(e) => up('contentPlan', e.target.value)} />
              </Field>
              <Field label="Do you have a crypto wallet?" required hint="You'll need one to receive payments. We can help.">
                <div className={styles.radioGroup}>
                  {['Yes, I already have one', 'No, but I can set one up', "No — I'd need help with this"].map((opt) => (
                    <label key={opt} className={`${styles.radioCard} ${form.walletReady === opt ? styles.radioCardActive : ''}`}>
                      <input type="radio" name="walletReady" checked={form.walletReady === opt} onChange={() => up('walletReady', opt)} />
                      {opt}
                    </label>
                  ))}
                </div>
              </Field>
              <div className={styles.disclaimer}>
                By submitting, you confirm you are the author of the work samples linked above. Once published, records are permanently archived on-chain and cannot be deleted.
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className={styles.nav}>
          {step > 1 && (
            <button className={styles.backBtn} onClick={() => setStep((s) => (s - 1) as Step)}>← Back</button>
          )}
          <div style={{ flex: 1 }} />
          {step < 3 ? (
            <button className={styles.nextBtn} onClick={() => setStep((s) => (s + 1) as Step)}>Continue →</button>
          ) : (
            <button className={styles.submitBtn} onClick={submit} disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Submitting…' : 'Submit Application →'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
        {label}{required && <span style={{ color: 'var(--accent)', marginLeft: 3 }}>*</span>}
      </label>
      {hint && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{hint}</span>}
      {children}
    </div>
  )
}
