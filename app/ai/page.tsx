'use client'
import { useState } from 'react'
import RecordCard from '@/components/ui/RecordCard'
import { RECORDS } from '@/lib/records'
import styles from './ai.module.css'

const SUGGESTIONS = [
  'Show me all Lazarus Group fund flow investigations',
  'INEC election documents from 2023',
  'Climate research challenging IPCC data',
  'Nigerian procurement corruption with source documents',
  'DeFi exploit analysis with wallet traces',
  'FOIA releases related to banking regulators',
]

export default function AIPage() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (q: string) => {
    if (!q.trim()) return
    setQuery(q)
    setLoading(true)
    setSubmitted(false)
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <h1 className={styles.title}>AI Search</h1>
        <span className={styles.badge}>Beta</span>
      </header>

      <div className={styles.searchArea}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </span>
          <input
            className={styles.input}
            placeholder="Ask anything — find records by topic, person, event, or claim..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
          />
          {query && (
            <button className={styles.submitBtn} onClick={() => handleSearch(query)}>
              Search →
            </button>
          )}
        </div>

        <p className={styles.hint}>
          Plain language search across all archived records. No exact keywords needed.
        </p>
      </div>

      {!submitted && !loading && (
        <div className={styles.suggestions}>
          <div className={styles.suggestionsLabel}>Try asking</div>
          <div className={styles.suggestionList}>
            {SUGGESTIONS.map((s) => (
              <button key={s} className={styles.suggestion} onClick={() => handleSearch(s)}>
                <span className={styles.suggestionIcon}>→</span>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.loadingDots}>
            <span /><span /><span />
          </div>
          <p className={styles.loadingText}>Searching {RECORDS.length} records…</p>
        </div>
      )}

      {submitted && !loading && (
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <span className={styles.resultsQuery}>"{query}"</span>
            <span className={styles.resultsCount}>{RECORDS.length} results</span>
          </div>
          <div className={styles.resultsList}>
            {RECORDS.map((r) => (
              <RecordCard key={r.id} record={r} variant="compact" />
            ))}
          </div>
          <div className={styles.aiNotice}>
            AI search coming soon — results above are showing all records. Real semantic search will surface the most relevant records by meaning, not just keywords.
          </div>
        </div>
      )}
    </main>
  )
}
