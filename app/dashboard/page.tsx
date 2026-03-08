import type { Metadata } from 'next'
import DashboardShell from '@/components/dashboard/DashboardShell'

export const metadata: Metadata = {
  title: 'Dashboard — The Record',
  description: 'Your journalist dashboard. Write, publish, and manage your investigations.',
}

export default function DashboardPage() {
  return <DashboardShell />
}
