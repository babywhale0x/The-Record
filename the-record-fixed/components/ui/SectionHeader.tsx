import styles from './SectionHeader.module.css'

interface SectionHeaderProps {
  label: string
}

export default function SectionHeader({ label }: SectionHeaderProps) {
  return (
    <div className={styles.header}>
      <span className={styles.label}>{label}</span>
      <div className={styles.rule} />
    </div>
  )
}
