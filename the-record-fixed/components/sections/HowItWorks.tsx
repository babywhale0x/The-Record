import SectionHeader from '@/components/ui/SectionHeader'
import styles from './HowItWorks.module.css'

const steps = [
  {
    number: '01',
    icon: '✍️',
    title: 'Write your investigation',
    body: 'Compose your article on The Record\'s editor and attach your source documents — PDFs, audio, video, screenshots. No character limits. No editorial gatekeepers.',
    badge: '✓ End-to-end encrypted in transit',
  },
  {
    number: '02',
    icon: '🔐',
    title: 'Published to the chain',
    body: 'Your content is stored as encrypted blobs on Shelby\'s global storage network. A cryptographic fingerprint is committed to the Aptos blockchain — making tampering immediately detectable.',
    badge: '✓ Tamper-evident on Aptos',
  },
  {
    number: '03',
    icon: '💸',
    title: 'Readers pay you directly',
    body: 'Set your access model — free, pay-per-article, or subscriber-only. Every payment goes wallet-to-wallet. No payment processor can freeze your account. No platform takes a cut.',
    badge: '✓ Wallet-to-wallet payments',
  },
]

export default function HowItWorks() {
  return (
    <section className={styles.section} id="how-it-works">
      <div className="container">
        <SectionHeader label="How It Works" />
        <h2 className={styles.title}>
          Write. Publish. Get paid.<br />
          No one can stop any of it.
        </h2>
        <p className={styles.body}>
          Built on Shelby Protocol and the Aptos blockchain — every article and
          source document is stored permanently across a decentralized network.
        </p>

        <div className={styles.grid}>
          {steps.map((step) => (
            <div key={step.number} className={styles.step}>
              <span className={styles.stepNumber}>{step.number} —</span>
              <div className={styles.stepIcon}>{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              <span className={styles.badge}>{step.badge}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
