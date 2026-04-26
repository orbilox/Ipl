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
    <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-[#070c18] border-r border-white/[0.06] h-screen">
      {/* Branding */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm leading-tight">Admin Panel</div>
            <div className="text-gray-600 text-[10px] uppercase tracking-widest">IPL Platform</div>
          </div>
        </div>
      </div>

      {/* Role identity card */}
      <div className="px-3 pt-3">
        <div className="rounded-xl bg-purple-950/40 border border-purple-800/25 p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-700/30 border border-purple-600/30 flex items-center justify-center text-base shrink-0">
            {userRole === 'superadmin' ? '👑' : '🔐'}
          </div>
          <div className="min-w-0">
            <div className="text-purple-200 text-xs font-semibold leading-tight">
              {userRole === 'superadmin' ? 'Super Admin' : 'Admin'}
            </div>
            <div className="text-gray-500 text-[10px] truncate leading-tight">{userName}</div>
          </div>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navSections.map(section => (
          <div key={section.label}>
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-700 px-3 mb-1">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                      active
                        ? 'nav-link-active'
                        : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]'
                    )}
                  >
                    <item.icon className="w-3.5 h-3.5 shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Back to user app */}
      <div className="p-2 border-t border-white/[0.06]">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-600 hover:text-gray-300 hover:bg-white/[0.04] transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to App
        </Link>
      </div>
    </aside>
  )
}
