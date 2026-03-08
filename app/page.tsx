import RecordCard from '@/components/ui/RecordCard'
import { RECORDS, getFeaturedRecords } from '@/lib/records'
import { CONTENT_TYPE_LIST } from '@/lib/content-types'
import styles from './home.module.css'

export default function HomePage() {
  const featured = getFeaturedRecords()
  const recent = RECORDS.slice(0, 6)

  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.logo}>The<span>Record</span></div>
        <div className={styles.topBarRight}>
          <span className={styles.networkBadge}>
            <span className={styles.networkDot} />
            Aptos Mainnet
          </span>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroEyebrow}>
          <span className={styles.eyebrowDot} />
          Permanent · Verified · On-Chain
        </div>
        <h1 className={styles.heroHeading}>The permanent record<br />for hard knowledge.</h1>
        <p className={styles.heroSub}>
          Every investigation, legal filing, research paper, and on-chain analysis — cryptographically committed to Aptos. Impossible to alter. Impossible to delete.
        </p>
        <div className={styles.heroStats}>
          <div className={styles.stat}><span className={styles.statNum}>14,280+</span><span className={styles.statLabel}>Records archived</span></div>
          <div className={styles.statDivider} />
          <div className={styles.stat}><span className={styles.statNum}>$0.014</span><span className={styles.statLabel}>Per GB on-chain</span></div>
          <div className={styles.statDivider} />
          <div className={styles.stat}><span className={styles.statNum}>100%</span><span className={styles.statLabel}>Tamper-evident</span></div>
        </div>
      </section>

      <section className={styles.typeSection}>
        <div className={styles.typeScroll}>
          <button className={`${styles.typeChip} ${styles.typeChipActive}`}>All</button>
          {CONTENT_TYPE_LIST.map((ct) => (
            <button key={ct.id} className={styles.typeChip}>
              <span>{ct.icon}</span> {ct.label}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Featured</h2>
          <span className={styles.sectionSub}>Editor-selected records</span>
        </div>
        <div className={styles.featuredGrid}>
          {featured.map((r) => (
            <RecordCard key={r.id} record={r} variant="featured" />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent</h2>
          <a href="/feed" className={styles.sectionLink}>See all →</a>
        </div>
        <div className={styles.recentList}>
          {recent.map((r) => (
            <RecordCard key={r.id} record={r} variant="default" />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>What gets published here</h2>
        </div>
        <div className={styles.typeGrid}>
          {CONTENT_TYPE_LIST.map((ct) => (
            <div key={ct.id} className={styles.typeCard} style={{ borderColor: ct.border }}>
              <span className={styles.typeCardIcon}>{ct.icon}</span>
              <div>
                <div className={styles.typeCardLabel} style={{ color: ct.color }}>{ct.label}</div>
                <div className={styles.typeCardDesc}>{ct.description}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>Publish your work. Get paid. Permanently.</h2>
          <p className={styles.ctaBody}>Open to investigators, researchers, lawyers, scientists, journalists, and analysts. Your work archived on-chain. Your earnings direct to your wallet.</p>
          <a href="/publish" className={styles.ctaBtn}>Apply to publish →</a>
        </div>
      </section>
    </main>
  )
}
