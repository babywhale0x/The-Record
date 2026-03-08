import styles from './AnnouncementBar.module.css'

export default function AnnouncementBar() {
  return (
    <div className={styles.bar}>
      🚧 <strong>Testnet Live</strong> — The Record is in early access.{' '}
      <a href="/apply">Apply to publish →</a>
    </div>
  )
}
