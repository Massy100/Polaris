'use client'

import { SignIn, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SignInPage() {
  const { isSignedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isSignedIn) {
      router.push('/top-of-page')
    }
  }, [isSignedIn, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn 
        afterSignInUrl="/top-of-page"
        afterSignUpUrl="/top-of-page"
        redirectUrl="/top-of-page"
        routing="path"
        signUpUrl="/sign-up"
      />
    </div>
  )
}