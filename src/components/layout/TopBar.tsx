'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Bell, Wallet, Trophy, LogOut, Settings, User, ChevronDown } from 'lucide-react'
import { formatTokens } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { useState, useRef, useEffect } from 'react'

export default function TopBar({ title }: { title?: string }) {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetch('/api/notifications').then(r => r.json()),
    refetchInterval: 30000,
  })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="sticky top-0 z-40 glass border-b border-white/5 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Logo (mobile) + Title */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
          </Link>
          {title && <h1 className="font-display font-bold text-white text-lg hidden sm:block">{title}</h1>}
        </div>

        {/* Right: Balance + Notifications + Avatar menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Wallet balance */}
          <Link
            href="/wallet"
            className="flex items-center gap-2 bg-gray-900/60 border border-gray-700/50 rounded-xl px-3 py-2 hover:border-orange-500/30 transition-colors"
          >
            <Wallet className="w-4 h-4 text-orange-400" />
            <span className="font-semibold text-sm text-white">
              {formatTokens(session?.user?.balance || 0)}
            </span>
          </Link>

          {/* Notifications */}
          <Link href="/dashboard" className="relative p-2 rounded-xl hover:bg-gray-800/50 transition-colors">
            <Bell className="w-5 h-5 text-gray-400" />
            {data?.unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                {data.unreadCount > 9 ? '9+' : data.unreadCount}
              </span>
            )}
          </Link>

          {/* Avatar + dropdown menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-1.5 rounded-xl hover:bg-gray-800/50 p-1 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#16213e] border border-gray-700/60 rounded-2xl shadow-xl shadow-black/40 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-700/50">
                  <div className="text-white text-sm font-semibold truncate">{session?.user?.name}</div>
                  <div className="text-gray-400 text-xs truncate">{session?.user?.email}</div>
                </div>
                <div className="p-1.5 space-y-0.5">
                  <Link href="/profile" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 text-sm transition-colors">
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  <Link href="/wallet" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 text-sm transition-colors">
                    <Wallet className="w-4 h-4" /> Wallet
                  </Link>
                  <Link href="/profile" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 text-sm transition-colors">
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                  <div className="border-t border-gray-700/50 my-1" />
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
