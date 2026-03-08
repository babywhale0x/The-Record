import SectionHeader from '@/components/ui/SectionHeader'
import styles from './ArchiveSection.module.css'

const sources = [
  { icon: '🗳️', name: 'INEC — Election Results & Filings',      count: '12,400+ docs', status: 'live' },
  { icon: '📋', name: 'BPP — Procurement Awards',               count: '8,900+ docs',  status: 'live' },
  { icon: '⚖️', name: 'EFCC — Press Releases & Convictions',    count: '3,200+ docs',  status: 'live' },
  { icon: '🏛️', name: 'National Assembly — Bills & Votes',      count: 'Coming Q2',    status: 'soon' },
  { icon: '🏦', name: 'CBN — Policy Circulars & Reports',        count: 'Coming Q2',    status: 'soon' },
  { icon: '⚖️', name: 'NJC — Judicial Appointments',            count: 'Coming Q3',    status: 'soon' },
]

export default function ArchiveSection() {
  return (
    <section className={styles.section} id="archive">
      <div className="container">
        <SectionHeader label="The Archive" />

        <div className={styles.grid}>
          <div>
            <h2 className={styles.title}>
              The public record.<br />
              Preserved before<br />
              it disappears.
            </h2>
            <p className={styles.body}>
              Our background archive continuously captures and permanently stores
              documents from Nigerian government portals — the moment they're published.
              Every document gets a tamper-evident hash on Aptos.
            </p>
            <p className={styles.body} style={{ marginTop: '16px' }}>
              When a government body quietly deletes or amends a document, The Record
              already has the original.
            </p>
            <div className={styles.cta}>
              <a href="/archive" className={styles.btn}>Search the archive →</a>
            </div>
          </div>

          <div className={styles.sourceList}>
            {sources.map((s) => (
              <div key={s.name} className={styles.sourceRow}>
                <span className={styles.sourceIcon}>{s.icon}</span>
                <span className={styles.sourceName}>{s.name}</span>
                <span className={styles.sourceCount}>{s.count}</span>
                <span className={`${styles.status} ${s.status === 'live' ? styles.live : styles.soon}`}>
                  {s.status === 'live' ? 'Live' : 'Soon'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
