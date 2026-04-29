'use client'

import { SignIn, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'
import './sign-in.css'

const clerkAppearance = {
  variables: {
    colorPrimary: '#1c415c',
    colorText: '#101b23',
    colorTextSecondary: '#567080',
    colorBackground: 'transparent',
    fontFamily: '"DM Sans", system-ui, sans-serif',
    borderRadius: '10px',
  },
  elements: {
    rootBox: 'custom-clerk-root',
    cardBox: 'custom-clerk-card-box',
    card: 'custom-clerk-card',
    headerTitle: 'custom-clerk-title',
    headerSubtitle: 'custom-clerk-subtitle',
    socialButtonsBlockButton: 'custom-clerk-social-btn',
    socialButtonsBlockButtonText: 'custom-clerk-social-btn-text',
    dividerRow: 'custom-clerk-divider-row',
    dividerText: 'custom-clerk-divider-text',
    formFieldLabel: 'custom-clerk-field-label',
    formFieldInput: 'custom-clerk-input',
    formButtonPrimary: 'custom-clerk-btn',
    footerActionText: 'custom-clerk-footer-text',
    footerActionLink: 'custom-clerk-footer-link',
    footer: 'custom-clerk-footer',
    badge: 'custom-clerk-badge',
  },
}

export default function SignInPage() {
  const { isSignedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isSignedIn) {
      router.push('/top-of-page')
    }
  }, [isSignedIn, router])

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-left">
          <div className="login-blob login-blob-1" />
          <div className="login-blob login-blob-2" />
          <div className="login-blob login-blob-3" />
          <div className="login-blob login-blob-4" />

          <div className="login-left-inner">
            <span className="login-eyebrow">
              Sistema De Gestión Académica &nbsp;·&nbsp; Universidad Rafael Landívar
            </span>

            <div className="login-logo-wrap">
              <Image
                src="/login-logo.png"
                alt="Logo Universidad Rafael Landívar"
                width={220}
                height={220}
                priority
              />
            </div>

            <div className="login-divider" />

            <h2 className="login-tagline">
              El conocimiento<br />
              no espera.<br />
              <em>Tú tampoco.</em>
            </h2>

            <p className="login-sub">
              Accede a la plataforma académica de la comunidad landivariana y continúa construyendo el futuro desde hoy.
            </p>

            <div className="login-stats-carousel">
              <div className="login-stat-slide">
                <span className="login-stat-num">+1,000</span>
                <span className="login-stat-label">Catedráticos activos</span>
              </div>
              <div className="login-stat-slide">
                <span className="login-stat-num">+20,000</span>
                <span className="login-stat-label">Estudiantes formados</span>
              </div>
              <div className="login-stat-slide">
                <span className="login-stat-num">75+</span>
                <span className="login-stat-label">Años de excelencia</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-clerk-wrap">
            <SignIn
              routing="hash"
              signUpUrl="/sign-up"
              fallbackRedirectUrl="/top-of-page"
              appearance={clerkAppearance}
            />
          </div>
        </div>
      </div>
    </div>
  )
}