import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Solo para peticiones API
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const url = request.nextUrl.pathname + request.nextUrl.search
    const newUrl = `https://polaris-backend-yjn8.onrender.com${url}`
    return NextResponse.rewrite(newUrl)
  }
}

export const config = {
  matcher: '/api/:path*',
}