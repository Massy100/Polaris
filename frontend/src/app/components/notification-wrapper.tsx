'use client';

import { usePathname } from 'next/navigation';
import NotificationBell from './notification-bell';

const EXCLUDED_ROUTES = [
  '/observations/evaluate',
  '/sign-in',
  '/sign-up'
];

export default function NotificationWrapper() {
  const pathname = usePathname();
  
  // No mostrar en rutas excluidas
  const isExcluded = EXCLUDED_ROUTES.some(route => pathname.startsWith(route));
  
  if (isExcluded) return null;

  return (
    <div className="nb-floating-wrapper">
      <NotificationBell />
    </div>
  );
}
