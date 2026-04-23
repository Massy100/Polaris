'use client'

import { usePathname } from 'next/navigation'
import AdminDashboardPanel from './admin-dashboard-panel'

const AUTH_ROUTES = ['/sign-in', '/sign-up']

export default function ConditionalPanel() {
  const pathname = usePathname()
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))

  if (isAuthRoute) return null

  return <AdminDashboardPanel userName="Jorge Escalante" />
}