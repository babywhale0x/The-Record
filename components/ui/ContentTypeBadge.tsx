import { CONTENT_TYPES, type ContentType } from '@/lib/content-types'
import styles from './ContentTypeBadge.module.css'

interface Props {
  type: ContentType
  size?: 'sm' | 'md'
}

export default function ContentTypeBadge({ type, size = 'md' }: Props) {
  const config = CONTENT_TYPES[type]
  return (
    <span
      className={`${styles.badge} ${styles[size]}`}
      style={{
        color: config.color,
        background: config.bg,
        borderColor: config.border,
      }}
    >
      <span className={styles.icon}>{config.icon}</span>
      {config.label}
    </span>
  )
}
