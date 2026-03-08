import Link from 'next/link'
import styles from './Footer.module.css'

const platformLinks = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'For Journalists', href: '#for-journalists' },
  { label: 'For Readers', href: '#for-readers' },
  { label: 'The Archive', href: '#archive' },
  { label: 'Pricing', href: '/pricing' },
]

const resourceLinks = [
  { label: 'Documentation', href: '/docs' },
  { label: 'Verify a Document', href: '/verify' },
  { label: 'API Access', href: '/api-access' },
  { label: 'Press Kit', href: '/press' },
]

const companyLinks = [
  { label: 'About', href: '/about' },
  { label: 'Grants & Funding', href: '/grants' },
  { label: 'Contact', href: '/contact' },
  { label: 'Twitter / X', href: 'https://twitter.com', target: '_blank' },
]

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.inner}>
          <div>
            <div className={styles.brand}>
              The<span>Record</span>
            </div>
            <p className={styles.tagline}>
              Censorship-resistant journalism and document verification
              infrastructure for West Africa.
            </p>
            <div className={styles.chain}>
              <span className={styles.chainDot} />
              Powered by Shelby Protocol on Aptos
            </div>
          </div>

          <div>
            <div className={styles.colTitle}>Platform</div>
            <ul className={styles.linkList}>
              {platformLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className={styles.colTitle}>Resources</div>
            <ul className={styles.linkList}>
              {resourceLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className={styles.colTitle}>Company</div>
            <ul className={styles.linkList}>
              {companyLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href} target={l.target}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <span className={styles.legal}>© 2026 The Record. Built in Nigeria.</span>
          <span className={styles.legal}>
            <Link href="/privacy">Privacy Policy</Link>
            {' · '}
            <Link href="/terms">Terms of Service</Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
