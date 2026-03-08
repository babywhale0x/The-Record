import SectionHeader from '@/components/ui/SectionHeader'
import DocumentMockup from '@/components/ui/DocumentMockup'
import styles from './ForJournalists.module.css'

const features = [
  {
    icon: '🛡️',
    title: 'Government-proof publishing',
    body: 'No single server, domain, or jurisdiction can take your work offline. Storage is distributed across nodes globally.',
  },
  {
    icon: '💳',
    title: 'Payment processor-proof revenue',
    body: 'Flutterwave, Paystack, Stripe — none of them can freeze your earnings. Readers pay you directly in stable assets.',
  },
  {
    icon: '📎',
    title: 'Source verification built in',
    body: 'Attach your source documents alongside your article. Readers can verify each document hasn\'t been altered since you uploaded it.',
  },
  {
    icon: '⏳',
    title: 'Dead man\'s switch publishing',
    body: 'Schedule time-locked releases — content becomes publicly readable on a set date, regardless of what happens to you or the platform.',
  },
  {
    icon: '🔍',
    title: 'Government document archive',
    body: 'Search our archived database of INEC results, procurement records, court filings, and CBN circulars while writing your investigation.',
  },
]

export default function ForJournalists() {
  return (
    <section className={styles.section} id="for-journalists">
      <div className="container">
        <SectionHeader label="For Journalists" />

        <div className={styles.twoCol}>
          <div>
            <h2 className={styles.title}>
              Built for journalists who refuse to be silenced.
            </h2>
            <p className={styles.body}>
              You've done the work. Written the story. Survived the pressure.
              The Record makes sure that story outlives every attempt to erase it.
            </p>

            <ul className={styles.featureList}>
              {features.map((f) => (
                <li key={f.title}>
                  <div className={styles.featureIcon}>{f.icon}</div>
                  <div>
                    <h4>{f.title}</h4>
                    <p>{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <DocumentMockup />
            <div className={styles.callout}>
              <p>
                <strong>If this document is deleted from BPP's website tomorrow</strong> —
                your readers can still verify this is the exact same file you cited,
                cryptographically unchanged. That's legally meaningful evidence.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
