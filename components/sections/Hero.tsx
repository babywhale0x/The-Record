import Link from 'next/link'
import styles from './Hero.module.css'

const stats = [
  { value: '0', unit: 'days',  label: 'Documents deleted by government' },
  { value: '100', unit: '%',   label: 'Of payments go to journalists' },
  { value: '∞',   unit: '',    label: 'Years your work is preserved' },
  { value: '0',   unit: '',    label: 'Platforms that can deplatform you' },
]

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className="container">
        <div className={`${styles.eyebrow} fade-up`}>
          Censorship-Resistant Publishing
        </div>

        <h1 className={`${styles.heading} fade-up delay-1`}>
          Your story.<br />
          <em>Permanent.</em><br />
          Verified. Yours.
        </h1>

        <p className={`${styles.sub} fade-up delay-2`}>
          The Record is a publishing and document verification platform for
          independent journalists in Nigeria and West Africa. Every story,
          every source — preserved on-chain and impossible to delete.
        </p>

        <div className={`${styles.actions} fade-up delay-3`}>
          <Link href="/apply" className={styles.btnHero}>
            Apply to Publish →
          </Link>
          <a href="#how-it-works" className={styles.secondaryLink}>
            See how it works
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <div className={`${styles.statsBar} fade-up delay-4`}>
          {stats.map((s) => (
            <div key={s.label} className={styles.statItem}>
              <div className={styles.statValue}>
                {s.value}
                {s.unit && <span className={styles.unit}>{s.unit}</span>}
              </div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
