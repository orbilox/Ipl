'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Users, Swords, CreditCard, Trophy, Settings,
  LogOut, ArrowLeft, Wallet, AlertCircle, ArrowDownLeft, ArrowUpRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  userRole: string
  userName: string
}

const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/matches', label: 'Matches', icon: Swords },
  { href: '/admin/deposits', label: 'Deposits', icon: ArrowDownLeft },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
  { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/admin/contests', label: 'Contests', icon: Trophy },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminSidebar({ userRole, userName }: Props) {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-[#16213e] border-r border-gray-800/50 h-screen">
      <div className="p-5 border-b border-gray-800/50">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle className="w-5 h-5 text-orange-400" />
          <span className="font-display font-bold text-white text-sm">Admin Panel</span>
        </div>
        <div className="text-gray-500 text-xs">IPL Trading Platform</div>
      </div>

      <div className="p-3 mx-3 mt-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
        <div className="text-purple-400 text-xs font-medium">
          {userRole === 'superadmin' ? '👑 Super Admin' : '🔐 Admin'}
        </div>
        <div className="text-gray-300 text-xs truncate">{userName}</div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {adminNav.map(item => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(active ? 'nav-link-active' : 'nav-link', 'text-sm')}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800/50 space-y-1">
        <Link href="/dashboard" className="nav-link text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to App
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="nav-link text-sm w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  )
}
