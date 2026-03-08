import SectionHeader from '@/components/ui/SectionHeader'
import styles from './ForReaders.module.css'

const cards = [
  {
    tag: 'Trust',
    title: 'Every source is verifiable',
    body: 'Every document cited in an investigation can be independently verified against its on-chain hash. You\'re not just reading a journalist\'s word — you\'re reading evidence.',
  },
  {
    tag: 'Access',
    title: 'Support journalists directly',
    body: '100% of your subscription or per-article payment goes to the journalist. No middleman. Your naira reaches the reporter who risked their safety to file the story.',
  },
  {
    tag: 'Permanence',
    title: 'The archive doesn\'t forget',
    body: 'Stories that get taken down elsewhere live here permanently. The Record is a living archive of African investigative journalism that no court order can erase.',
  },
]

export default function ForReaders() {
  return (
    <section className={styles.section} id="for-readers">
      <div className="container">
        <SectionHeader label="For Readers" />
        <h2 className={styles.title}>
          Read the journalism<br />
          power doesn't want published.
        </h2>

        <div className={styles.grid}>
          {cards.map((c) => (
            <div key={c.tag} className={styles.card}>
              <div className={styles.tag}>{c.tag}</div>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
