'use client'

import { SignIn, useAuth } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
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

function SignInContent() {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const status = searchParams.get('status')

  useEffect(() => {
    if (isSignedIn && !status) {
      router.push('/top-of-page')
    }
  }, [isSignedIn, router, status])

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
              SGA Polaris &nbsp;·&nbsp; Universidad Rafael Landívar
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
              Donde la fe<br />
              ilumina la razón.<br />
              <em>Hacia el Magis.</em>
            </h2>

            <p className="login-sub">
              Bienvenido a Polaris. Accede al corazón de nuestra gestión académica para seguir forjando el legado landivariano con integridad y excelencia.
            </p>

            <div className="login-stats-grid">
              <div className="login-stat-item">
                <span className="login-stat-num">+1,000</span>
                <span className="login-stat-label">Catedráticos de Excelencia</span>
              </div>
              <div className="login-stat-item">
                <span className="login-stat-num">+20,000</span>
                <span className="login-stat-label">Líderes que Transforman</span>
              </div>
              <div className="login-stat-item">
                <span className="login-stat-num">75+</span>
                <span className="login-stat-label">Años de Prestigio</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-clerk-wrap">
            {status === 'pending' && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800 font-semibold">Perfil en Revisión</p>
                    <p className="text-xs text-blue-700 mt-1">Tu solicitud de acceso está siendo procesada por la Decanatura.</p>
                  </div>
                </div>
              </div>
            )}
            {status === 'inactive' && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800 font-semibold">Acceso Limitado</p>
                    <p className="text-xs text-red-700 mt-1">Tu cuenta requiere autorización activa. Por favor, contacta a Secretaría General.</p>
                  </div>
                </div>
              </div>
            )}
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

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">Cargando portal institucional...</div>}>
      <SignInContent />
    </Suspense>
  )
}
