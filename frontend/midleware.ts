import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  if (pathname.startsWith('/api/')) {
    const backendUrl = `https://polaris-backend-yjn8.onrender.com${pathname}${request.nextUrl.search}`
    
    return NextResponse.rewrite(backendUrl)
  }
  
  return NextResponse.next()
}


export const config = {
  matcher: '/api/:path*',
}