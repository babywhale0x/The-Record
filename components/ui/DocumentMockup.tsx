import styles from './DocumentMockup.module.css'

export default function DocumentMockup() {
  return (
    <div className={styles.card}>
      {/* Browser chrome */}
      <div className={styles.header}>
        <div className={`${styles.dot} ${styles.red}`} />
        <div className={`${styles.dot} ${styles.amber}`} />
        <div className={`${styles.dot} ${styles.green}`} />
        <div className={styles.urlBar} />
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          INVESTIGATION · PUBLISHED MAR 7, 2026 · THE RECORD
        </div>

        <div className={styles.headline}>
          How ₦4.2bn in NDDC contracts were awarded to shell companies linked to the Minister
        </div>

        <div className={styles.lines}>
          <div className={styles.line} style={{ width: '100%' }} />
          <div className={styles.line} style={{ width: '92%' }} />
          <div className={styles.line} style={{ width: '97%' }} />
          <div className={styles.line} style={{ width: '85%' }} />
          <div className={styles.line} style={{ width: '60%' }} />
        </div>

        <div className={styles.evidence}>
          <div className={styles.evidenceTitle}>⛓ Source Document — On-Chain Verified</div>
          <div className={styles.hash}>
            aptos:0x4a3f...c1d9 · sha256: 8b2e4f1a9c7d3e6b...
          </div>
          <div className={styles.filename}>
            BPP_Procurement_Award_2024_Q3.pdf
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.timestamp}>Archived: 07 Mar 2026, 21:14 WAT</span>
          <span className={styles.verified}>
            <span className={styles.verifiedDot} />
            Verified Unchanged
          </span>
        </div>
      </div>
    </div>
  )
}
