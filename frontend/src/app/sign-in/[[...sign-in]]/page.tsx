'use client'

import { SignIn } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (searchParams.get('unauthorized') === '1') {
      setShowBanner(true)
      const t = setTimeout(() => setShowBanner(false), 4000)
      return () => clearTimeout(t)
    }
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {showBanner && (
        <div style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.25rem',
          zIndex: 9999,
          background: '#1a1a2e',
          color: '#f8fafc',
          border: '1px solid #e74c3c',
          borderRadius: '0.625rem',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
          animation: 'slideInRight 0.3s ease',
          maxWidth: '340px',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Debes iniciar sesión para acceder a esa sección.
        </div>
      )}

      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/top-of-page"
      />
    </div>
  )
}