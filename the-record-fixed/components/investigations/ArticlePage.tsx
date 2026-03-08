'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Investigation } from '@/lib/investigations'
import styles from './ArticlePage.module.css'

interface Props {
  article: Investigation
}

export default function ArticlePage({ article }: Props) {
  const [paid, setPaid] = useState(article.accessModel === 'free')
  const [paying, setPaying] = useState(false)
  const [verifyingDoc, setVerifyingDoc] = useState<string | null>(null)
  const [verifiedDoc, setVerifiedDoc] = useState<string | null>(null)

  const handlePay = async () => {
    setPaying(true)
    await new Promise((r) => setTimeout(r, 1600))
    setPaying(false)
    setPaid(true)
  }

  const handleVerifyDoc = async (hash: string) => {
    setVerifyingDoc(hash)
    await new Promise((r) => setTimeout(r, 1400))
    setVerifyingDoc(null)
    setVerifiedDoc(hash)
  }

  const bodyParagraphs = article.body.split('\n\n').filter(Boolean)
  const previewParagraphs = bodyParagraphs.slice(0, 3)
  const lockedParagraphs = bodyParagraphs.slice(3)

  return (
    <div className={styles.page}>

      {/* Article header — full width dark */}
      <div className={styles.articleHeader}>
        <div className="container">
          <Link href="/investigations" className={styles.backLink}>
            ← All investigations
          </Link>

          <div className={styles.headerMeta}>
            <span className={styles.category}>{article.category}</span>
            <span className={styles.metaDot}>·</span>
            <span className={styles.date}>{article.publishedAt}</span>
            <span className={styles.metaDot}>·</span>
            <span className={styles.readTime}>{article.readTime}</span>
          </div>

          <h1 className={styles.title}>{article.title}</h1>
          <p className={styles.excerpt}>{article.excerpt}</p>

          <div className={styles.headerBottom}>
            <div className={styles.authorBlock}>
              <div className={styles.authorAvatar}>{article.author.initials}</div>
              <div>
                <div className={styles.authorName}>{article.author.name}</div>
                {article.author.twitter && (
                  <div className={styles.authorTwitter}>{article.author.twitter}</div>
                )}
              </div>
            </div>

            <div className={styles.headerBadges}>
              {article.onChain && (
                <div className={styles.onChainBadge}>
                  <span className={styles.onChainDot} />
                  Archived on Shelby · Verified on Aptos
                </div>
              )}
              <div className={styles.readsBadge}>
                {article.reads.toLocaleString()} reads
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className={styles.main}>
        <div className="container">
          <div className={styles.layout}>

            {/* Article body */}
            <article className={styles.article}>

              {/* Visible paragraphs */}
              {previewParagraphs.map((para, i) => (
                <Paragraph key={i} text={para} />
              ))}

              {/* Paywall or locked content */}
              {!paid && lockedParagraphs.length > 0 ? (
                <Paywall article={article} onPay={handlePay} paying={paying} />
              ) : (
                lockedParagraphs.map((para, i) => (
                  <Paragraph key={`locked-${i}`} text={para} />
                ))
              )}

              {/* After full article — author bio */}
              {paid && (
                <div className={styles.authorBio}>
                  <div className={styles.authorBioAvatar}>{article.author.initials}</div>
                  <div>
                    <div className={styles.authorBioName}>{article.author.name}</div>
                    <p className={styles.authorBioText}>{article.author.bio}</p>
                    {article.author.twitter && (
                      <a
                        href={`https://twitter.com/${article.author.twitter.replace('@', '')}`}
                        className={styles.authorBioTwitter}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Follow {article.author.twitter}  ↗
                      </a>
                    )}
                  </div>
                </div>
              )}
            </article>

            {/* Sidebar */}
            <aside className={styles.sidebar}>

              {/* On-chain verification card */}
              <div className={styles.sideCard}>
                <div className={styles.sideCardTitle}>⛓ On-Chain Record</div>
                <p className={styles.sideCardBody}>
                  This article is permanently stored on Shelby Protocol.
                  Any future alteration is immediately detectable.
                </p>
                <div className={styles.hashBlock}>
                  <div className={styles.hashLabel}>Aptos Hash</div>
                  <div className={styles.hashValue}>{article.aptosHash.slice(0, 20)}…</div>
                </div>
                <div className={styles.hashBlock}>
                  <div className={styles.hashLabel}>Shelby Blob</div>
                  <div className={styles.hashValue}>{article.shelbyBlob}</div>
                </div>
                <a
                  href={`https://explorer.shelby.xyz/testnet`}
                  className={styles.explorerLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Verify on explorer ↗
                </a>
              </div>

              {/* Source documents */}
              <div className={styles.sideCard}>
                <div className={styles.sideCardTitle}>
                  📎 Source Documents
                  <span className={styles.docCount}>{article.documents.length}</span>
                </div>
                <p className={styles.sideCardBody}>
                  Every document is archived on Shelby and hash-committed to Aptos.
                  Click Verify to confirm it hasn't been altered.
                </p>
                <div className={styles.docList}>
                  {article.documents.map((doc) => (
                    <div key={doc.hash} className={styles.docItem}>
                      <div className={styles.docIcon}>
                        {doc.type === 'pdf' ? '📄' : doc.type === 'csv' ? '📊' : '📎'}
                      </div>
                      <div className={styles.docInfo}>
                        <div className={styles.docName}>{doc.name}</div>
                        <div className={styles.docSource}>{doc.source}</div>
                        <div className={styles.docArchived}>Archived {doc.archivedAt}</div>
                      </div>
                      <button
                        className={`${styles.verifyBtn} ${verifiedDoc === doc.hash ? styles.verifyBtnDone : ''}`}
                        onClick={() => handleVerifyDoc(doc.hash)}
                        disabled={verifyingDoc === doc.hash || verifiedDoc === doc.hash}
                      >
                        {verifyingDoc === doc.hash ? (
                          <span className={styles.verifySpinner} />
                        ) : verifiedDoc === doc.hash ? (
                          '✓ Verified'
                        ) : (
                          'Verify'
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className={styles.sideCard}>
                <div className={styles.sideCardTitle}>Tags</div>
                <div className={styles.tagCloud}>
                  {article.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              </div>

              {/* Support prompt */}
              {article.accessModel === 'free' && (
                <div className={styles.supportCard}>
                  <div className={styles.supportTitle}>This investigation is free.</div>
                  <p className={styles.supportBody}>
                    Support independent journalism in Nigeria by subscribing to {article.author.name}'s work.
                  </p>
                  <button className={styles.supportBtn}>Subscribe to {article.author.name}</button>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Paragraph renderer — handles **bold** and headings ── */
function Paragraph({ text }: { text: string }) {
  const isHeading = text.startsWith('**') && text.endsWith('**') && !text.includes('\n')

  if (isHeading) {
    return (
      <h2 className={styles.bodyHeading}>
        {text.replace(/\*\*/g, '')}
      </h2>
    )
  }

  // Inline bold
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <p className={styles.bodyPara}>
      {parts.map((part, i) =>
        part.startsWith('**') ? (
          <strong key={i}>{part.replace(/\*\*/g, '')}</strong>
        ) : (
          part
        )
      )}
    </p>
  )
}

/* ── Paywall ── */
function Paywall({
  article,
  onPay,
  paying,
}: {
  article: Investigation
  onPay: () => void
  paying: boolean
}) {
  return (
    <div className={styles.paywall}>
      <div className={styles.paywallFade} />
      <div className={styles.paywallCard}>
        <div className={styles.paywallEyebrow}>
          {article.accessModel === 'subscription'
            ? 'Subscribers Only'
            : `${article.price} to read`}
        </div>
        <h3 className={styles.paywallTitle}>
          {article.accessModel === 'subscription'
            ? 'This investigation is for subscribers.'
            : 'Continue reading this investigation.'}
        </h3>
        <p className={styles.paywallBody}>
          {article.accessModel === 'subscription'
            ? `Subscribe to ${article.author.name}'s work to read this and all future investigations.`
            : `Pay once to unlock this investigation. 100% goes directly to ${article.author.name}.`}
        </p>

        <div className={styles.paywallFeatures}>
          <span>✓ Full investigation</span>
          <span>✓ All {article.documents.length} source documents</span>
          <span>✓ On-chain tamper verification</span>
        </div>

        <button
          className={styles.paywallBtn}
          onClick={onPay}
          disabled={paying}
        >
          {paying ? (
            <span className={styles.payingState}>
              <span className={styles.paySpinner} />
              Processing…
            </span>
          ) : article.accessModel === 'subscription' ? (
            `Subscribe →`
          ) : (
            `Pay ${article.price} to read →`
          )}
        </button>

        <div className={styles.paywallNote}>
          Wallet-to-wallet · No platform fee · Permanent access
        </div>
      </div>
    </div>
  )
}
