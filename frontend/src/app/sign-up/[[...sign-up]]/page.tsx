'use client'

import { SignUp, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'
import './sign-up.css'

const clerkAppearance = {
  elements: {
    rootBox: {
      width: '100%',
      minWidth: 0,
    },
    card: {
      width: '100%',
      minWidth: 0,
      maxWidth: '100%',
      boxShadow: 'none',
      border: 'none',
      padding: 0,
      background: 'transparent',
      margin: 0,
    },
    headerTitle: {
      fontFamily: 'inherit',
      fontSize: '26px',
      fontWeight: '700',
      letterSpacing: '-0.02em',
    },
    headerSubtitle: {
      fontFamily: 'inherit',
      fontSize: '14px',
    },
    socialButtonsBlockButton: {
      width: '100%',
      boxShadow: 'none',
      fontFamily: 'inherit',
    },
    formFieldInput: {
      width: '100%',
      fontFamily: 'inherit',
      fontSize: '14px',
      boxShadow: 'none',
    },
    formButtonPrimary: {
      width: '100%',
      fontFamily: 'inherit',
      fontWeight: '600',
      fontSize: '15px',
      background: 'linear-gradient(135deg, #0D1F4E 0%, #1A3270 100%)',
      boxShadow: 'none',
    },
    footer: {
      background: 'transparent',
      border: 'none',
    },
    badge: {
      display: 'none',
    },
  },
}

export default function SignUpPage() {
  const { isSignedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isSignedIn) {
      router.push('/top-of-page')
    }
  }, [isSignedIn, router])

  return (
    <div className="signup-root">
      <div className="signup-card">
        <div className="signup-left">
          <div className="signup-blob signup-blob-1" />
          <div className="signup-blob signup-blob-2" />
          <div className="signup-blob signup-blob-3" />
          <div className="signup-blob signup-blob-4" />

          <div className="signup-left-inner">
            <span className="signup-eyebrow">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Sistema de Gestión Académica
            </span>

            <div className="signup-logo-wrap">
              <Image
                src="/login-logo.png"
                alt="Logo Universidad Rafael Landívar"
                width={240}
                height={240}
                priority
              />
            </div>

            <div className="signup-divider" />

            <h2 className="signup-tagline">
              Tu camino hacia<br />
              la <em>excelencia</em><br />
              comienza aquí
            </h2>

            <p className="signup-sub">
              Únete a la comunidad landivariana y accede a la plataforma de evaluación y gestión académica.
            </p>

            <div className="signup-stats-carousel">
              <div className="signup-stat-slide">
                <span className="signup-stat-num">+1,000</span>
                <span className="signup-stat-label">Catedráticos</span>
              </div>
              <div className="signup-stat-slide">
                <span className="signup-stat-num">9</span>
                <span className="signup-stat-label">Facultades</span>
              </div>
              <div className="signup-stat-slide">
                <span className="signup-stat-num">+40</span>
                <span className="signup-stat-label">Carreras de pregrado</span>
              </div>
              <div className="signup-stat-slide">
                <span className="signup-stat-num">9</span>
                <span className="signup-stat-label">Sedes en Guatemala</span>
              </div>
            </div>
          </div>
        </div>

        <div className="signup-right">
          <div className="signup-clerk-wrap">
            <SignUp
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
              fallbackRedirectUrl="/top-of-page"
              appearance={clerkAppearance}
            />
          </div>
        </div>
      </div>
    </div>
  )
}