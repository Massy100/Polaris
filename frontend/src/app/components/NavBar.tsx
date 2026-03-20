'use client'

import Link from 'next/link'
import { UserButton, SignInButton, SignOutButton, useAuth } from '@clerk/nextjs'

export default function NavBar() {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) {
    return <div className="bg-gray-800 text-white p-4">Cargando...</div>
  }

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Mi App
        </Link>
        
        <div className="flex gap-4 items-center">
          {isSignedIn ? (
            <>
              <Link href="/dashboard" className="hover:text-gray-300">
                Dashboard
              </Link>
              <Link href="/perfil" className="hover:text-gray-300">
                Perfil
              </Link>
              <UserButton />
              <SignOutButton>
                <button className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 text-white text-sm">
                  Cerrar Sesión
                </button>
              </SignOutButton>
            </>
          ) : (
            <SignInButton mode="modal">
              <button className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 text-white">
                Iniciar Sesión
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </nav>
  )
}