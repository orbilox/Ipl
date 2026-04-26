'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Swords, CreditCard, Trophy,
  Settings, ArrowLeft, ArrowDownLeft, ArrowUpRight, Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  userRole: string
  userName: string
}

const navSections = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ]
  },
  {
    label: 'Management',
    items: [
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/matches', label: 'Matches', icon: Swords },
      { href: '/admin/contests', label: 'Contests', icon: Trophy },
    ]
  },
  {
    label: 'Finance',
    items: [
      { href: '/admin/deposits', label: 'Deposits', icon: ArrowDownLeft },
      { href: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
      { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
    ]
  },
  {
    label: 'System',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ]
  },
]

export default function AdminSidebar({ userRole, userName }: Props) {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen"
      style={{ background: 'linear-gradient(180deg, #1a0533 0%, #0f0120 50%, #08011a 100%)' }}>

      {/* Top purple accent line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-purple-600 via-violet-500 to-purple-600" />

      {/* Branding */}
      <div className="px-4 py-4 border-b border-purple-900/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-900/50">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm leading-tight">Admin Panel</div>
            <div className="text-purple-400/60 text-[10px] uppercase tracking-widest">IPL Platform</div>
          </div>
        </div>
      </div>

      {/* Role identity card */}
      <div className="px-3 pt-3">
        <div className="rounded-xl border border-purple-700/30 p-3 flex items-center gap-2.5"
          style={{ background: 'rgba(139, 92, 246, 0.08)' }}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-700 to-violet-800 flex items-center justify-center text-base shrink-0 shadow-md shadow-purple-900/40">
            {userRole === 'superadmin' ? '👑' : '🔐'}
          </div>
          <div className="min-w-0">
            <div className="text-purple-200 text-xs font-semibold leading-tight">
              {userRole === 'superadmin' ? 'Super Admin' : 'Admin'}
            </div>
            <div className="text-purple-400/50 text-[10px] truncate leading-tight">{userName}</div>
          </div>
          <div className="ml-auto">
            <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded px-1.5 py-0.5">
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {navSections.map(section => (
          <div key={section.label}>
            <div className="text-[9px] font-bold uppercase tracking-widest text-purple-600/60 px-3 mb-1.5">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = ('exact' in item && item.exact) ? pathname === item.href : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                      active
                        ? 'bg-purple-600/25 border border-purple-500/40 text-purple-200 shadow-sm shadow-purple-900/30'
                        : 'text-purple-300/40 hover:text-purple-200 hover:bg-purple-500/10'
                    )}
                  >
                    <item.icon className={cn('w-4 h-4 shrink-0', active ? 'text-purple-400' : '')} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Back to user app */}
      <div className="p-3 border-t border-purple-900/40">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-purple-400/50 hover:text-purple-300 hover:bg-purple-500/10 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to User App
        </Link>
      </div>
    </aside>
  )
}
