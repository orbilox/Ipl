import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Admin routes require admin role
    if (pathname.startsWith('/admin')) {
      if (!token || (token.role !== 'admin' && token.role !== 'superadmin')) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }

    // Redirect logged-in users away from public/auth pages
    const isAuthPage = pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/register')
    if (token && isAuthPage) {
      const role = token.role as string
      if (role === 'admin' || role === 'superadmin') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname
        // Public routes — allow through (redirect handled above if logged in)
        if (
          pathname === '/' ||
          pathname.startsWith('/login') ||
          pathname.startsWith('/register') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/images')
        ) {
          return true
        }
        return !!token
      }
    }
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)']
}
