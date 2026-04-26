'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Bell, Wallet, Trophy, Search } from 'lucide-react'
import { formatTokens } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'

export default function TopBar({ title }: { title?: string }) {
  const { data: session } = useSession()

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetch('/api/notifications').then(r => r.json()),
    refetchInterval: 30000,
  })

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

        {/* Right: Balance + Notifications */}
        <div className="flex items-center gap-3">
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

          {/* Avatar */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm">
            {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  )
}
