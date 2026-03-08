import Link from 'next/link'
import styles from './CTASection.module.css'

export default function CTASection() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.eyebrow}>Apply for Early Access</div>
        <h2 className={styles.heading}>
          The truth deserves<br />
          <em>permanent storage.</em>
        </h2>
        <p className={styles.body}>
          We're onboarding our first cohort of independent journalists in Nigeria
          and West Africa. Applications are open.
        </p>
        <div className={styles.actions}>
          <Link href="/apply" className={styles.btnPrimary}>
            Apply to Publish
          </Link>
          <Link href="/investigations" className={styles.btnGhost}>
            Read the latest investigations
          </Link>
        </div>
      </div>
    </section>
  )
}
