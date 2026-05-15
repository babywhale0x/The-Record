'use client'

import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <div style={{ paddingTop: 'var(--top-bar-h)' }}>
        {children}
      </div>
      <BottomNav />
    </>
  )
}
