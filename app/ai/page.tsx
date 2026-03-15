'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import ContentTypeBadge from '@/components/ui/ContentTypeBadge'
import styles from './ai.module.css'

type Mode = 'search' | 'ask'
type Status = 'idle' | 'loading' | 'done' | 'error'

interface MatchRecord {
  id: string; slug: string; title: string; excerpt: string
  content_type: string; publisher_name: string; tags: string[]
  aptos_tx_hash?: string; price_view: number; created_at: string
  relevance: string; score: number
}

interface SearchResult {
  interpretation: string
  matches: MatchRecord[]
  keywords: string[]
  suggestion: string | null
}

const SUGGESTIONS = [
  { icon: '🔍', text: 'Show me investigations into government corruption in West Africa' },
  { icon: '⛓', text: 'On-chain analysis of the 2024 bridge exploits' },
  { icon: '🔬', text: 'Research challenging official climate data' },
  { icon: '⚖️', text: 'Legal documents about election fraud' },
  { icon: '📊', text: 'DeFi fund flows linked to sanctioned wallets' },
  { icon: '📰', text: 'Journalism about central bank forex policies' },
]

const ASK_SUGGESTIONS = [
  'What investigations have been published about North Korea?',
  'Which publishers focus on on-chain analysis?',
  'What records mention INEC or Nigerian elections?',
  'Summarize what the archive knows about bridge exploits',
]

export default function AIPage() {
  const [mode, setMode] = useState<Mode>('search')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<SearchResult | null>(null)
  const [answer, setAnswer] = useState<string | null>(null)
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([])
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const handleSubmit = async (q?: string) => {
    const queryText = q || query
    if (!queryText.trim() || status === 'loading') return

    setStatus('loading')
    setResult(null)
    setAnswer(null)

    if (mode === 'ask') {
      setChatHistory(h => [...h, { role: 'user', text: queryText }])
    }

    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, mode }),
      })
      const data = await res.json()

      if (data.error) {
        const errMsg = data.error
        setStatus('error')
        if (mode === 'ask') {
          setChatHistory(h => [...h, { role: 'ai', text: `⚠ ${errMsg}` }])
        }
        return
      }

      if (mode === 'search') {
        setResult(data)
      } else {
        const aiText = data.answer || 'No response from AI.'
        setChatHistory(h => [...h, { role: 'ai', text: aiText }])
        setAnswer(aiText)
      }
      setStatus('done')
    } catch (err: any) {
      setStatus('error')
      const msg = err?.message || 'Something went wrong. Please try again.'
      if (mode === 'ask') {
        setChatHistory(h => [...h, { role: 'ai', text: `⚠ ${msg}` }])
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
      setQuery('')
    }
  }

  const switchMode = (m: Mode) => {
    setMode(m)
    setStatus('idle')
    setResult(null)
    setAnswer(null)
    setQuery('')
    if (m === 'ask') setChatHistory([])
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <h1 className={styles.title}>AI</h1>
        <span className={styles.badge}>BETA</span>
      </header>

      {/* Mode switcher */}
      <div className={styles.modeSwitcher}>
        <button
          className={`${styles.modeBtn} ${mode === 'search' ? styles.modeBtnActive : ''}`}
          onClick={() => switchMode('search')}
        >
          <span>🔍</span> Search Archive
        </button>
        <button
          className={`${styles.modeBtn} ${mode === 'ask' ? styles.modeBtnActive : ''}`}
          onClick={() => switchMode('ask')}
        >
          <span>💬</span> Ask the Archive
        </button>
      </div>

      {/* Search mode */}
      {mode === 'search' && (
        <div className={styles.searchArea}>
          <p className={styles.modeDesc}>
            Describe what you're looking for in plain language. No need to know exact titles or publishers.
          </p>

          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>◎</span>
            <textarea
              ref={inputRef}
              className={styles.searchInput}
              placeholder="e.g. investigations into money laundering through shell companies in Nigeria..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
            />
            <button
              className={styles.searchBtn}
              onClick={() => handleSubmit()}
              disabled={status === 'loading' || !query.trim()}
            >
              {status === 'loading' ? '...' : '→'}
            </button>
          </div>

          {/* Suggestions */}
          {status === 'idle' && (
            <div className={styles.suggestions}>
              <p className={styles.suggestLabel}>Try searching for:</p>
              <div className={styles.suggestGrid}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    className={styles.suggestChip}
                    onClick={() => handleSubmit(s.text)}
                  >
                    <span>{s.icon}</span>
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {status === 'loading' && (
            <div className={styles.loadingWrap}>
              <div className={styles.loadingDots}>
                <span /><span /><span />
              </div>
              <p className={styles.loadingText}>Searching the archive…</p>
            </div>
          )}

          {/* Results */}
          {status === 'done' && result && (
            <div className={styles.results}>
              <div className={styles.interpretation}>
                <span className={styles.interpretLabel}>AI understood:</span>
                <span className={styles.interpretText}>"{result.interpretation}"</span>
              </div>

              {result.matches.length > 0 ? (
                <>
                  <p className={styles.resultCount}>
                    {result.matches.length} matching record{result.matches.length !== 1 ? 's' : ''} found
                  </p>
                  <div className={styles.matchList}>
                    {result.matches.map((r) => (
                      <Link key={r.slug} href={`/records/${r.slug}`} className={styles.matchCard}>
                        <div className={styles.matchTop}>
                          <ContentTypeBadge type={r.content_type as any} size="sm" />
                          <div className={styles.matchScore}>
                            <div
                              className={styles.matchScoreBar}
                              style={{ width: `${r.score}%` }}
                            />
                            <span>{r.score}% match</span>
                          </div>
                        </div>
                        <h3 className={styles.matchTitle}>{r.title}</h3>
                        <p className={styles.matchRelevance}>🤖 {r.relevance}</p>
                        <p className={styles.matchExcerpt}>{r.excerpt}</p>
                        <div className={styles.matchMeta}>
                          <span>{r.publisher_name}</span>
                          <span>·</span>
                          <span>{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span>·</span>
                          <span>{parseFloat(((r.price_view || 0) / 10000).toFixed(4)).toString()} APT to view</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <div className={styles.noMatches}>
                  <span className={styles.noMatchIcon}>◎</span>
                  <p>No records found matching your description.</p>
                  {result.suggestion && (
                    <p className={styles.noMatchSuggestion}>{result.suggestion}</p>
                  )}
                </div>
              )}

              {result.keywords.length > 0 && (
                <div className={styles.keywords}>
                  <span className={styles.keywordsLabel}>Related keywords:</span>
                  {result.keywords.map((k) => (
                    <button
                      key={k}
                      className={styles.keywordChip}
                      onClick={() => { setQuery(k); handleSubmit(k) }}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Ask mode */}
      {mode === 'ask' && (
        <div className={styles.askArea}>
          <p className={styles.modeDesc}>
            Ask questions about what's in the archive. The AI will answer based on published records.
          </p>

          {/* Chat history */}
          <div className={styles.chatHistory}>
            {chatHistory.length === 0 && (
              <div className={styles.chatEmpty}>
                <div className={styles.chatEmptyIcon}>◈</div>
                <p>Ask anything about the archive</p>
                <div className={styles.askSuggestions}>
                  {ASK_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      className={styles.askChip}
                      onClick={() => handleSubmit(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`${styles.chatMsg} ${msg.role === 'user' ? styles.chatMsgUser : styles.chatMsgAI}`}
              >
                {msg.role === 'ai' && <span className={styles.chatAIIcon}>◈</span>}
                <div className={styles.chatBubble}>
                  {msg.text.split('\n').map((line, j) => (
                    <p key={j} className={styles.chatLine}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {status === 'loading' && (
              <div className={`${styles.chatMsg} ${styles.chatMsgAI}`}>
                <span className={styles.chatAIIcon}>◈</span>
                <div className={styles.chatBubble}>
                  <div className={styles.loadingDots}><span /><span /><span /></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className={styles.chatInputWrap}>
            <textarea
              ref={inputRef}
              className={styles.chatInput}
              placeholder="Ask the archive anything…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className={styles.chatSendBtn}
              onClick={() => { const q = query; setQuery(''); handleSubmit(q) }}
              disabled={status === 'loading' || !query.trim()}
            >→</button>
          </div>
        </div>
      )}
    </main>
  )
}
