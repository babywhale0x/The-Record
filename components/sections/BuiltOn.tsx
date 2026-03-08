import styles from './BuiltOn.module.css'

const techs = [
  'Shelby Protocol',
  'Aptos Blockchain',
  'Erasure Coding',
  'On-Chain Audit Trail',
  'Next.js',
]

export default function BuiltOn() {
  return (
    <div className={styles.section}>
      <div className="container">
        <div className={styles.inner}>
          <span className={styles.label}>Built on</span>
          <div className={styles.pills}>
            {techs.map((t) => (
              <span key={t} className={styles.pill}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
