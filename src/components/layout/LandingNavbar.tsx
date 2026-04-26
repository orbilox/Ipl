'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Trophy, LayoutDashboard } from 'lucide-react'

export default function LandingNavbar() {
  const { data: session, status } = useSession()
  const loading = status === 'loading'
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'superadmin'

  return (
    <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-white">IPL <span className="text-orange-400">Trading</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
          <Link href="#contests" className="hover:text-white transition-colors">Contests</Link>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-24 h-9 bg-gray-800 rounded-xl animate-pulse" />
          ) : session ? (
            <Link
              href={isAdmin ? '/admin' : '/dashboard'}
              className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-4 py-2">
                Login
              </Link>
              <Link href="/register" className="btn-primary text-sm px-5 py-2.5">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
