'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard, Swords, Trophy, Wallet, BarChart3, Users,
  Star, LogOut, Trophy as TrophyIcon, Bell, Settings, ChevronDown
} from 'lucide-react'
import { cn, formatTokens } from '@/lib/utils'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/matches', label: 'Live Matches', icon: Swords, badge: 'LIVE' },
  { href: '/contests', label: 'Contests', icon: Trophy },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/portfolio', label: 'My Portfolio', icon: BarChart3 },
  { href: '/leaderboard', label: 'Leaderboard', icon: Star },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#16213e] border-r border-gray-800/50 h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800/50">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <TrophyIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm">IPL Trading</div>
            <div className="text-gray-500 text-xs">Cricket Exchange</div>
          </div>
        </Link>
      </div>

      {/* Balance card */}
      <div className="p-4 mx-4 mt-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
        <div className="text-gray-400 text-xs mb-1">Token Balance</div>
        <div className="font-display font-bold text-xl text-white">
          {formatTokens(session?.user?.balance || 0)}
        </div>
        <Link href="/wallet" className="mt-2 inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-medium">
          <Wallet className="w-3 h-3" /> Buy Tokens
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(active ? 'nav-link-active' : 'nav-link')}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="badge-live text-[10px]">
                  <span className="live-dot" style={{ width: 5, height: 5 }} />
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User menu */}
      <div className="p-4 border-t border-gray-800/50">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/50 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm">
            {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 text-left overflow-hidden">
            <div className="text-white text-sm font-medium truncate">{session?.user?.name}</div>
            <div className="text-gray-400 text-xs truncate">{session?.user?.email}</div>
          </div>
          <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', showUserMenu && 'rotate-180')} />
        </button>

        {showUserMenu && (
          <div className="mt-2 space-y-1">
            <Link href="/profile" className="nav-link text-sm py-2">
              <Settings className="w-4 h-4" /> Settings
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="nav-link text-sm py-2 w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
