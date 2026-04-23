'use client'

import { SignIn, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'
import './sign-in.css'

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
              Sistema De Gestión Académica • Universidad Rafael Landívar
            </span>

            <div className="login-logo-wrap">
              <Image
                src="/login-logo.png"
                alt="Logo Universidad Rafael Landívar"
                width={240}
                height={240}
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
                <span className="login-stat-num">+40</span>
                <span className="login-stat-label">CARRERAS DE PREGRADO</span>
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
              appearance={clerkAppearance}
            />
          </div>
        </div>
      </div>
    </div>
  )
}