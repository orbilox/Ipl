import { prisma } from '@/lib/db'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Users, TrendingUp, Wallet, Trophy, Swords, CreditCard, Activity, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 30

export default async function AdminDashboardPage() {
  const [
    totalUsers, activeUsers, totalDeposits, totalWithdrawals,
    totalTrades, activeTrades, totalBets, liveMatches,
    recentTransactions, pendingWithdrawals
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'user' } }),
    prisma.user.count({ where: { role: 'user', isActive: true } }),
    prisma.deposit.aggregate({ _sum: { amount: true } }),
    prisma.withdrawal.aggregate({ _sum: { amount: true }, where: { status: 'completed' } }),
    prisma.trade.count(),
    prisma.trade.count({ where: { status: 'active' } }),
    prisma.bet.count(),
    prisma.match.count({ where: { status: 'live' } }),
    prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { name: true, email: true } } }
    }),
    prisma.withdrawal.count({ where: { status: 'pending' } })
  ])

  const revenue = (totalDeposits._sum.amount || 0) - (totalWithdrawals._sum.amount || 0)

  const stats = [
    { label: 'Total Users', value: totalUsers.toLocaleString(), sub: `${activeUsers} active`, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10', href: '/admin/users' },
    { label: 'Revenue', value: formatCurrency(revenue), sub: 'Deposits - Withdrawals', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10', href: '/admin/transactions' },
    { label: 'Total Deposits', value: formatCurrency(totalDeposits._sum.amount || 0), sub: 'All time', icon: Wallet, color: 'text-orange-400', bg: 'bg-orange-400/10', href: '/admin/transactions' },
    { label: 'Total Trades', value: totalTrades.toLocaleString(), sub: `${activeTrades} active now`, icon: Activity, color: 'text-purple-400', bg: 'bg-purple-400/10', href: '/admin/users' },
    { label: 'Total Bets', value: totalBets.toLocaleString(), sub: 'All time bets', icon: CreditCard, color: 'text-yellow-400', bg: 'bg-yellow-400/10', href: '/admin/transactions' },
    { label: 'Live Matches', value: liveMatches.toString(), sub: 'Currently live', icon: Swords, color: 'text-red-400', bg: 'bg-red-400/10', href: '/admin/matches' },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm">IPL Trading Platform Overview</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingWithdrawals > 0 && (
            <Link href="/admin/withdrawals"
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors">
              ⚠️ {pendingWithdrawals} pending withdrawals
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href} className="stat-card hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">{stat.label}</span>
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', stat.bg)}>
                <stat.icon className={cn('w-5 h-5', stat.color)} />
              </div>
            </div>
            <div className="font-display font-bold text-2xl text-white">{stat.value}</div>
            <div className="text-gray-500 text-xs mt-1">{stat.sub}</div>
          </Link>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Recent Transactions</h2>
          <Link href="/admin/transactions" className="text-orange-400 text-xs flex items-center gap-1">
            View all <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-800">
                <th className="text-left pb-3 font-medium">User</th>
                <th className="text-left pb-3 font-medium">Type</th>
                <th className="text-right pb-3 font-medium">Amount</th>
                <th className="text-right pb-3 font-medium hidden sm:table-cell">Balance</th>
                <th className="text-right pb-3 font-medium hidden md:table-cell">Time</th>
              </tr>
            </thead>
            <tbody className="space-y-2">
              {recentTransactions.map(tx => (
                <tr key={tx.id} className="border-b border-gray-800/30">
                  <td className="py-3">
                    <div className="text-white text-xs">{tx.user?.name}</div>
                    <div className="text-gray-500 text-xs">{tx.user?.email}</div>
                  </td>
                  <td className="py-3">
                    <span className={`badge text-xs ${
                      ['deposit', 'bonus', 'trade_win', 'bet_win', 'refund'].includes(tx.type)
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {tx.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className={tx.amount > 0 ? 'text-green-400' : 'text-red-400'}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                    </span>
                  </td>
                  <td className="py-3 text-right text-gray-400 hidden sm:table-cell">
                    {formatCurrency(tx.balance)}
                  </td>
                  <td className="py-3 text-right text-gray-500 text-xs hidden md:table-cell">
                    {formatDateTime(tx.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
