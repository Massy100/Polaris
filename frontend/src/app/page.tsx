import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import NavBar from './components/NavBar'

export default async function Home() {
  const { userId } = await auth()
  
  return (
    <>
      <NavBar />
      <main className="container mx-auto p-8">
        <h1 className="text-4xl font-bold mb-4">
          Bienvenido a mi aplicación
        </h1>
        
        {userId ? (
          <div>
            <p className="mb-4">Has iniciado sesión correctamente</p>
            <p>Tu User ID: {userId}</p>
            <Link 
              href="/dashboard" 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 inline-block mt-4"
            >
              Ir al Dashboard
            </Link>
          </div>
        ) : (
          <div>
            <p className="mb-4">Por favor inicia sesión para continuar</p>
            <Link 
              href="/sign-in" 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 inline-block"
            >
              Iniciar Sesión
            </Link>
          </div>
        )}
      </main>
    </>
  )
}