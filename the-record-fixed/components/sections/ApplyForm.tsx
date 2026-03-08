'use client'

import { useState } from 'react'
import styles from './ApplyForm.module.css'

type Step = 1 | 2 | 3
type Status = 'idle' | 'submitting' | 'success'

interface FormData {
  // Step 1 — Identity
  fullName: string
  email: string
  twitterHandle: string
  country: string
  city: string
  // Step 2 — Journalism
  outlet: string
  yearsExperience: string
  beats: string[]
  sampleUrl1: string
  sampleUrl2: string
  threatExperience: string
  // Step 3 — Platform
  contentPlan: string
  accessModel: string
  walletReady: string
  referral: string
}

const BEATS = [
  'Politics & Governance',
  'Corruption & Accountability',
  'Business & Finance',
  'Human Rights',
  'Security & Conflict',
  'Environment',
  'Health',
  'Technology',
  'Education',
  'Other',
]

const COUNTRIES = [
  'Nigeria', 'Ghana', 'Senegal', 'Kenya', 'Côte d\'Ivoire',
  'Cameroon', 'Mali', 'Burkina Faso', 'Niger', 'Togo',
  'Benin', 'Sierra Leone', 'Liberia', 'Guinea', 'Gambia',
  'Other',
]

const initialData: FormData = {
  fullName: '',
  email: '',
  twitterHandle: '',
  country: '',
  city: '',
  outlet: '',
  yearsExperience: '',
  beats: [],
  sampleUrl1: '',
  sampleUrl2: '',
  threatExperience: '',
  contentPlan: '',
  accessModel: '',
  walletReady: '',
  referral: '',
}

export default function ApplyForm() {
  const [step, setStep] = useState<Step>(1)
  const [status, setStatus] = useState<Status>('idle')
  const [data, setData] = useState<FormData>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const update = (field: keyof FormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const toggleBeat = (beat: string) => {
    setData((prev) => ({
      ...prev,
      beats: prev.beats.includes(beat)
        ? prev.beats.filter((b) => b !== beat)
        : [...prev.beats, beat],
    }))
  }

  const validateStep = (s: Step): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (s === 1) {
      if (!data.fullName.trim())   newErrors.fullName = 'Required'
      if (!data.email.trim())      newErrors.email = 'Required'
      if (!data.country)           newErrors.country = 'Required'
    }
    if (s === 2) {
      if (!data.yearsExperience)   newErrors.yearsExperience = 'Required'
      if (data.beats.length === 0) newErrors.beats = 'Select at least one beat'
      if (!data.sampleUrl1.trim()) newErrors.sampleUrl1 = 'Provide at least one work sample'
      if (!data.threatExperience)  newErrors.threatExperience = 'Required'
    }
    if (s === 3) {
      if (!data.contentPlan.trim()) newErrors.contentPlan = 'Required'
      if (!data.accessModel)        newErrors.accessModel = 'Required'
      if (!data.walletReady)        newErrors.walletReady = 'Required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const next = () => {
    if (validateStep(step)) setStep((s) => (s < 3 ? (s + 1) as Step : s))
  }

  const back = () => setStep((s) => (s > 1 ? (s - 1) as Step : s))

  const submit = async () => {
    if (!validateStep(3)) return
    setStatus('submitting')
    // Simulate API call — replace with real endpoint later
    await new Promise((r) => setTimeout(r, 1800))
    setStatus('success')
  }

  if (status === 'success') {
    return <SuccessState name={data.fullName.split(' ')[0]} email={data.email} />
  }

  return (
    <div className={styles.page}>
      {/* Left panel — context */}
      <aside className={styles.aside}>
        <div className={styles.asideInner}>
          <div className={styles.asideLogo}>
            The<span>Record</span>
          </div>
          <h1 className={styles.asideHeading}>
            Apply to<br />publish.
          </h1>
          <p className={styles.asideBody}>
            We're onboarding our first cohort of independent journalists
            in Nigeria and West Africa. We review every application personally.
          </p>

          <div className={styles.criteria}>
            <div className={styles.criteriaTitle}>What we look for</div>
            <ul>
              <li>
                <span className={styles.check}>✓</span>
                Independent or freelance journalist
              </li>
              <li>
                <span className={styles.check}>✓</span>
                Based in Nigeria or West Africa
              </li>
              <li>
                <span className={styles.check}>✓</span>
                At least one published investigation or in-depth report
              </li>
              <li>
                <span className={styles.check}>✓</span>
                Covers accountability, governance, or public interest beats
              </li>
            </ul>
          </div>

          <div className={styles.promise}>
            <div className={styles.promiseTitle}>Our promise to you</div>
            <p>
              We will never sell your data, share your identity without consent,
              or cooperate with any government request to remove your work.
              Your content belongs to you — permanently.
            </p>
          </div>

          {/* Step indicator */}
          <div className={styles.stepIndicator}>
            {([1, 2, 3] as Step[]).map((s) => (
              <div
                key={s}
                className={`${styles.stepDot} ${step === s ? styles.stepDotActive : ''} ${step > s ? styles.stepDotDone : ''}`}
              >
                {step > s ? '✓' : s}
              </div>
            ))}
            <div className={styles.stepLabels}>
              <span className={step === 1 ? styles.stepLabelActive : ''}>Identity</span>
              <span className={step === 2 ? styles.stepLabelActive : ''}>Your Work</span>
              <span className={step === 3 ? styles.stepLabelActive : ''}>Platform</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Right panel — form */}
      <main className={styles.formPanel}>
        <div className={styles.formInner}>
          {/* Progress bar */}
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          <div className={styles.stepLabel}>
            Step {step} of 3 —{' '}
            {step === 1 ? 'Your Identity' : step === 2 ? 'Your Journalism' : 'On The Record'}
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Who are you?</h2>
              <p className={styles.stepSubtitle}>
                Tell us the basics. We keep everything confidential until you're approved.
              </p>

              <div className={styles.fieldGroup}>
                <Field
                  label="Full name"
                  required
                  error={errors.fullName}
                  hint="Or the name you publish under"
                >
                  <input
                    type="text"
                    className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
                    placeholder="e.g. Fisayo Soyombo"
                    value={data.fullName}
                    onChange={(e) => update('fullName', e.target.value)}
                  />
                </Field>

                <Field label="Email address" required error={errors.email}>
                  <input
                    type="email"
                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                    placeholder="you@domain.com"
                    value={data.email}
                    onChange={(e) => update('email', e.target.value)}
                  />
                </Field>

                <Field label="Twitter / X handle" hint="Optional but helpful for verification">
                  <div className={styles.inputPrefix}>
                    <span className={styles.prefix}>@</span>
                    <input
                      type="text"
                      className={styles.inputWithPrefix}
                      placeholder="yourhandle"
                      value={data.twitterHandle}
                      onChange={(e) => update('twitterHandle', e.target.value)}
                    />
                  </div>
                </Field>

                <div className={styles.twoCol}>
                  <Field label="Country" required error={errors.country}>
                    <select
                      className={`${styles.select} ${errors.country ? styles.inputError : ''}`}
                      value={data.country}
                      onChange={(e) => update('country', e.target.value)}
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="City" hint="Optional">
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. Lagos"
                      value={data.city}
                      onChange={(e) => update('city', e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="Media outlet or affiliation" hint="Leave blank if fully independent">
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Freelance / The Gazette"
                    value={data.outlet}
                    onChange={(e) => update('outlet', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Your journalism.</h2>
              <p className={styles.stepSubtitle}>
                Show us what you cover and why The Record matters to your work.
              </p>

              <div className={styles.fieldGroup}>
                <Field label="Years of journalism experience" required error={errors.yearsExperience}>
                  <div className={styles.radioGroup}>
                    {['Less than 1 year', '1–3 years', '3–7 years', '7+ years'].map((opt) => (
                      <label key={opt} className={`${styles.radioCard} ${data.yearsExperience === opt ? styles.radioCardSelected : ''}`}>
                        <input
                          type="radio"
                          name="yearsExperience"
                          value={opt}
                          checked={data.yearsExperience === opt}
                          onChange={() => update('yearsExperience', opt)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </Field>

                <Field label="Beats you cover" required error={errors.beats as string}>
                  <div className={styles.beatGrid}>
                    {BEATS.map((beat) => (
                      <button
                        key={beat}
                        type="button"
                        className={`${styles.beatChip} ${data.beats.includes(beat) ? styles.beatChipSelected : ''}`}
                        onClick={() => toggleBeat(beat)}
                      >
                        {beat}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field
                  label="Work sample — URL 1"
                  required
                  error={errors.sampleUrl1}
                  hint="Link to your best published investigation or in-depth report"
                >
                  <input
                    type="url"
                    className={`${styles.input} ${errors.sampleUrl1 ? styles.inputError : ''}`}
                    placeholder="https://..."
                    value={data.sampleUrl1}
                    onChange={(e) => update('sampleUrl1', e.target.value)}
                  />
                </Field>

                <Field label="Work sample — URL 2" hint="Optional second sample">
                  <input
                    type="url"
                    className={styles.input}
                    placeholder="https://..."
                    value={data.sampleUrl2}
                    onChange={(e) => update('sampleUrl2', e.target.value)}
                  />
                </Field>

                <Field
                  label="Have you ever faced censorship, deplatforming, or payment blocks because of your journalism?"
                  required
                  error={errors.threatExperience}
                >
                  <div className={styles.radioGroup}>
                    {[
                      'Yes — directly experienced it',
                      'Yes — colleagues have, I worry I will',
                      'Not yet, but I cover sensitive topics',
                      'No',
                    ].map((opt) => (
                      <label
                        key={opt}
                        className={`${styles.radioCard} ${data.threatExperience === opt ? styles.radioCardSelected : ''}`}
                      >
                        <input
                          type="radio"
                          name="threatExperience"
                          value={opt}
                          checked={data.threatExperience === opt}
                          onChange={() => update('threatExperience', opt)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>On The Record.</h2>
              <p className={styles.stepSubtitle}>
                Tell us what you'll publish and how you want to monetize it.
              </p>

              <div className={styles.fieldGroup}>
                <Field
                  label="What will you publish on The Record?"
                  required
                  error={errors.contentPlan}
                  hint="Describe your planned investigations, series, or beat coverage. 2–4 sentences."
                >
                  <textarea
                    className={`${styles.textarea} ${errors.contentPlan ? styles.inputError : ''}`}
                    placeholder="e.g. I plan to publish a series investigating oil block allocation in the Delta region, backed by NNPCL procurement documents I've been collecting for 6 months..."
                    rows={5}
                    value={data.contentPlan}
                    onChange={(e) => update('contentPlan', e.target.value)}
                  />
                </Field>

                <Field
                  label="How do you want to monetize your work?"
                  required
                  error={errors.accessModel}
                >
                  <div className={styles.accessCards}>
                    {[
                      {
                        value: 'free',
                        label: 'Free for all',
                        desc: 'Readers access everything for free. Build audience first, monetize later.',
                      },
                      {
                        value: 'pay-per-article',
                        label: 'Pay per article',
                        desc: 'Readers pay once to unlock each investigation. Best for one-off scoops.',
                      },
                      {
                        value: 'subscription',
                        label: 'Subscription',
                        desc: 'Monthly subscriber access to all your work. Best for consistent output.',
                      },
                      {
                        value: 'hybrid',
                        label: 'Hybrid',
                        desc: 'Free previews with paid full reports. Best for growing while earning.',
                      },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`${styles.accessCard} ${data.accessModel === opt.value ? styles.accessCardSelected : ''}`}
                      >
                        <input
                          type="radio"
                          name="accessModel"
                          value={opt.value}
                          checked={data.accessModel === opt.value}
                          onChange={() => update('accessModel', opt.value)}
                        />
                        <div className={styles.accessCardLabel}>{opt.label}</div>
                        <div className={styles.accessCardDesc}>{opt.desc}</div>
                      </label>
                    ))}
                  </div>
                </Field>

                <Field
                  label="Do you have a crypto wallet?"
                  required
                  error={errors.walletReady}
                  hint="You'll need one to receive reader payments. We can help you set one up."
                >
                  <div className={styles.radioGroup}>
                    {[
                      'Yes, I already have one',
                      'No, but I can set one up',
                      'No, and I\'d need help with this',
                    ].map((opt) => (
                      <label
                        key={opt}
                        className={`${styles.radioCard} ${data.walletReady === opt ? styles.radioCardSelected : ''}`}
                      >
                        <input
                          type="radio"
                          name="walletReady"
                          value={opt}
                          checked={data.walletReady === opt}
                          onChange={() => update('walletReady', opt)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </Field>

                <Field label="How did you hear about The Record?" hint="Optional">
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Twitter, a colleague, event..."
                    value={data.referral}
                    onChange={(e) => update('referral', e.target.value)}
                  />
                </Field>

                <div className={styles.disclaimer}>
                  <p>
                    By submitting, you confirm that you are the author of the work samples
                    you've linked, and that you understand The Record stores your published
                    content permanently on a decentralized network — it cannot be deleted
                    once published. Read our{' '}
                    <a href="/terms">Terms of Service</a> before proceeding.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className={styles.formNav}>
            {step > 1 && (
              <button type="button" className={styles.btnBack} onClick={back}>
                ← Back
              </button>
            )}
            <div className={styles.navRight}>
              {step < 3 ? (
                <button type="button" className={styles.btnNext} onClick={next}>
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.btnSubmit}
                  onClick={submit}
                  disabled={status === 'submitting'}
                >
                  {status === 'submitting' ? (
                    <span className={styles.submitting}>
                      <span className={styles.spinner} />
                      Submitting…
                    </span>
                  ) : (
                    'Submit Application →'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

/* ── Field wrapper ── */
function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.req}>*</span>}
      </label>
      {hint && <span className={styles.hint}>{hint}</span>}
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}

/* ── Success state ── */
function SuccessState({ name, email }: { name: string; email: string }) {
  return (
    <div className={styles.successPage}>
      <div className={styles.successInner}>
        <div className={styles.successIcon}>📬</div>
        <div className={styles.successEyebrow}>Application Received</div>
        <h1 className={styles.successHeading}>
          Thank you, {name}.
        </h1>
        <p className={styles.successBody}>
          We've received your application and will review it personally.
          You'll hear from us at <strong>{email}</strong> within 5–7 business days.
        </p>

        <div className={styles.successCard}>
          <div className={styles.successCardTitle}>What happens next</div>
          <ol className={styles.successSteps}>
            <li>
              <span className={styles.successNum}>01</span>
              <div>
                <strong>We review your application</strong>
                <p>Our team reads every application. We look at your work samples and your beat coverage.</p>
              </div>
            </li>
            <li>
              <span className={styles.successNum}>02</span>
              <div>
                <strong>We may reach out with questions</strong>
                <p>For some applicants we'll want a brief call or follow-up email before approving.</p>
              </div>
            </li>
            <li>
              <span className={styles.successNum}>03</span>
              <div>
                <strong>You get access to your dashboard</strong>
                <p>On approval, you'll receive a link to set up your wallet and access the publishing dashboard.</p>
              </div>
            </li>
          </ol>
        </div>

        <a href="/" className={styles.successHome}>← Back to The Record</a>
      </div>
    </div>
  )
}
