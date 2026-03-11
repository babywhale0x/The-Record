import { NextRequest } from 'next/server'

export function checkAdminAuth(req: NextRequest): boolean {
  const password = req.headers.get('x-admin-password')
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return false
  return password === adminPassword
}
