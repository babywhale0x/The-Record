'use client'

import { useState } from 'react'
import DashboardNav from './DashboardNav'
import DashboardHome from './DashboardHome'
import ArticleEditor from './ArticleEditor'
import styles from './DashboardShell.module.css'

export type DashboardView = 'home' | 'new-article' | 'edit-article'

export interface Article {
  id: string
  title: string
  excerpt: string
  status: 'draft' | 'published' | 'scheduled'
  accessModel: 'free' | 'pay-per-article' | 'subscription'
  price?: string
  publishedAt?: string
  reads: number
  earnings: string
  onChain: boolean
}

// Mock data — replace with real API calls in Phase 2
const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'How ₦4.2bn in NDDC contracts were awarded to shell companies linked to the Minister',
    excerpt: 'A six-month investigation into procurement irregularities at the Niger Delta Development Commission reveals a network of shell companies with direct links to the current Minister\'s family.',
    status: 'published',
    accessModel: 'pay-per-article',
    price: '₦500',
    publishedAt: 'Mar 5, 2026',
    reads: 1204,
    earnings: '₦143,200',
    onChain: true,
  },
  {
    id: '2',
    title: 'INEC\'s missing 47,000 votes: The Rivers State anomaly nobody is talking about',
    excerpt: 'Cross-referencing ward-level result sheets with the official INEC portal reveals a 47,000-vote discrepancy in the gubernatorial rerun — and the documents to prove it.',
    status: 'published',
    accessModel: 'subscription',
    publishedAt: 'Feb 18, 2026',
    reads: 3891,
    earnings: '₦0',
    onChain: true,
  },
  {
    id: '3',
    title: 'The CBN forex directive that enriched five connected banks — and nobody reported it',
    excerpt: 'Draft in progress.',
    status: 'draft',
    accessModel: 'pay-per-article',
    price: '₦800',
    reads: 0,
    earnings: '₦0',
    onChain: false,
  },
]

export default function DashboardShell() {
  const [view, setView] = useState<DashboardView>('home')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES)

  const handleEdit = (id: string) => {
    setEditingId(id)
    setView('edit-article')
  }

  const handleNewArticle = () => {
    setEditingId(null)
    setView('new-article')
  }

  const handleBackToHome = () => {
    setView('home')
    setEditingId(null)
  }

  const editingArticle = editingId ? articles.find((a) => a.id === editingId) : undefined

  return (
    <div className={styles.shell}>
      <DashboardNav
        view={view}
        onNavigate={setView}
        onNewArticle={handleNewArticle}
      />
      <div className={styles.content}>
        {view === 'home' && (
          <DashboardHome
            articles={articles}
            onEdit={handleEdit}
            onNewArticle={handleNewArticle}
          />
        )}
        {(view === 'new-article' || view === 'edit-article') && (
          <ArticleEditor
            article={editingArticle}
            onBack={handleBackToHome}
          />
        )}
      </div>
    </div>
  )
}
