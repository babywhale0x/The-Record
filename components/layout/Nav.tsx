import Link from 'next/link'
import styles from './Nav.module.css'

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.wordmark}>
          The<span>Record</span>
        </Link>

        <ul className={styles.links}>
          <li><a href="#how-it-works">How It Works</a></li>
          <li><a href="#for-journalists">For Journalists</a></li>
          <li><a href="#archive">The Archive</a></li>
          <li><Link href="/about">About</Link></li>
        </ul>

        <div className={styles.cta}>
          <Link href="/signin" className={styles.btnGhost}>Sign In</Link>
          <Link href="/apply" className={styles.btnPrimary}>Apply to Publish</Link>
        </div>
      </div>
    </nav>
  )
}
