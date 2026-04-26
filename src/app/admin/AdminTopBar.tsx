'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { LogOut, ArrowDownLeft, ArrowUpRight, ChevronRight, Shield } from 'lucide-react'
import { usePathname } from 'next/navigation'

interface Props {
  pendingDeposits: number
  pendingWithdrawals: number
  adminName: string
  adminRole: string
}

const breadcrumbMap: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/users': 'Users',
  '/admin/matches': 'Matches',
  '/admin/deposits': 'Deposits',
  '/admin/withdrawals': 'Withdrawals',
  '/admin/transactions': 'Transactions',
  '/admin/contests': 'Contests',
  '/admin/settings': 'Settings',
}

export default function AdminTopBar({ pendingDeposits, pendingWithdrawals, adminName, adminRole }: Props) {
  const pathname = usePathname()
  const pageName = breadcrumbMap[pathname] || 'Admin'

  return (
    <header className="h-14 bg-[#070c18] border-b border-white/[0.06] flex items-center justify-between px-6 shrink-0">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Shield className="w-3.5 h-3.5 text-purple-500" />
        <span className="text-gray-600">Admin</span>
        <ChevronRight className="w-3 h-3 text-gray-700" />
        <span className="text-gray-300 font-medium">{pageName}</span>

        {/* Pending alert pills */}
        {pendingDeposits > 0 && (
          <Link href="/admin/deposits"
            className="ml-3 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md px-2.5 py-1 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors">
            <ArrowDownLeft className="w-3 h-3" />
            {pendingDeposits} deposit{pendingDeposits !== 1 ? 's' : ''} pending
          </Link>
        )}
        {pendingWithdrawals > 0 && (
          <Link href="/admin/withdrawals"
            className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-md px-2.5 py-1 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors">
            <ArrowUpRight className="w-3 h-3" />
            {pendingWithdrawals} withdrawal{pendingWithdrawals !== 1 ? 's' : ''} pending
          </Link>
        )}
      </div>

      {/* Right: admin identity + sign out */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-gray-200 text-xs font-medium leading-tight">{adminName}</div>
          <div className="text-purple-400 text-[10px] leading-tight">
            {adminRole === 'superadmin' ? '👑 Super Admin' : '🔐 Admin'}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          title="Sign out"
          className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
