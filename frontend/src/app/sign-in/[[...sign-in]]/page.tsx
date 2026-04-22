'use client'

import { SignIn } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import './sign-in.css'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (searchParams.get('unauthorized') === '1') {
      setShowBanner(true)
      const t = setTimeout(() => setShowBanner(false), 4500)
      return () => clearTimeout(t)
    }
  }, [searchParams])

  return (
    <div className="login-root">
      {showBanner && (
        <div className="login-toast">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Debes iniciar sesión para acceder a esa sección.
        </div>
      )}

      <div className="login-card">

        <div className="login-left">
          <div className="login-blob login-blob-1" />
          <div className="login-blob login-blob-2" />
          <div className="login-blob login-blob-3" />
          <div className="login-blob login-blob-4" />

          <div className="login-left-inner">
            <span className="login-eyebrow">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Sistema de Gestión Académica
            </span>

            <div className="login-logo-wrap">
              <Image
                src="/login-logo.png"
                alt="Logo Universidad Rafael Landívar"
                width={210}
                height={210}
                priority
              />
            </div>

            <div className="login-divider" />

            <h2 className="login-tagline">
              Donde la <em>inteligencia</em><br />
              y el <em>corazón</em> se forman<br />
              para servir al mundo
            </h2>

            <p className="login-sub">
              Tradición jesuita de más de seis décadas formando líderes con valores, rigor académico y compromiso con Guatemala.
            </p>

            <div className="login-stats-carousel">
              <div className="login-stat-slide">
                <span className="login-stat-num">+1,000</span>
                <span className="login-stat-label">Catedráticos</span>
              </div>
              <div className="login-stat-slide">
                <span className="login-stat-num">9</span>
                <span className="login-stat-label">Facultades</span>
              </div>
              <div className="login-stat-slide">
                <span className="login-stat-num">+40</span>
                <span className="login-stat-label">Carreras de pregrado</span>
              </div>
              <div className="login-stat-slide">
                <span className="login-stat-num">9</span>
                <span className="login-stat-label">Sedes en Guatemala</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-clerk-wrap">
            <SignIn
              routing="path"
              path="/sign-in"
              signUpUrl="/sign-up"
              fallbackRedirectUrl="/top-of-page"
            />
          </div>
        </div>

      </div>
    </div>
  )
}