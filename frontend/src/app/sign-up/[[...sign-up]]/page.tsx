'use client'

import { SignUp, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'
import './sign-up.css'

const clerkAppearance = {
  variables: {
    colorPrimary: '#0D1F4E',
    colorText: '#0D1F4E',
    colorTextSecondary: '#6E80A0',
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
              Sistema De Gestión Académica &nbsp;*&nbsp; Universidad Rafael Landívar
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