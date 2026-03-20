import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NavBar from '../components/NavBar'

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  const user = await currentUser()
  
  return (
    <>
      <NavBar />
      <main className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <p><strong>Email:</strong> {user?.emailAddresses[0].emailAddress}</p>
          <p><strong>User ID:</strong> {userId}</p>
          {user?.imageUrl && (
            <img 
              src={user.imageUrl} 
              alt="Profile" 
              className="w-16 h-16 rounded-full mt-4"
            />
          )}
        </div>
      </main>
    </>
  )
}