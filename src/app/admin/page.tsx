import { prisma } from '@/lib/db'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Users, TrendingUp, Wallet, Trophy, Swords, CreditCard, Activity, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 30

export default async function AdminDashboardPage() {
  const [
    totalUsers, activeUsers, totalDeposits, totalWithdrawals,
    totalTrades, activeTrades, totalBets, liveMatches,
    recentTransactions, pendingDeposits, pendingWithdrawals
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'user' } }),
    prisma.user.count({ where: { role: 'user', isActive: true } }),
    prisma.deposit.aggregate({ _sum: { amount: true }, where: { status: 'approved' } }),
    prisma.withdrawal.aggregate({ _sum: { amount: true }, where: { status: 'approved' } }),
    prisma.trade.count(),
    prisma.trade.count({ where: { status: 'active' } }),
    prisma.bet.count(),
    prisma.match.count({ where: { status: 'live' } }),
    prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { name: true, email: true } } }
    }),
    prisma.deposit.count({ where: { status: 'pending' } }),
    prisma.withdrawal.count({ where: { status: 'pending' } }),
  ])

  const revenue = (totalDeposits._sum.amount || 0) - (totalWithdrawals._sum.amount || 0)
  const hasPendingActions = pendingDeposits > 0 || pendingWithdrawals > 0

  const stats = [
    { label: 'Total Users', value: totalUsers.toLocaleString(), sub: `${activeUsers} active`, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10', href: '/admin/users' },
    { label: 'Net Revenue', value: formatCurrency(revenue), sub: 'Deposits minus withdrawals', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10', href: '/admin/transactions' },
    { label: 'Total Deposited', value: formatCurrency(totalDeposits._sum.amount || 0), sub: 'All approved deposits', icon: Wallet, color: 'text-violet-400', bg: 'bg-violet-400/10', href: '/admin/deposits' },
    { label: 'Active Trades', value: activeTrades.toLocaleString(), sub: `${totalTrades} total all time`, icon: Activity, color: 'text-amber-400', bg: 'bg-amber-400/10', href: '/admin/users' },
    { label: 'Total Bets', value: totalBets.toLocaleString(), sub: 'All time', icon: CreditCard, color: 'text-pink-400', bg: 'bg-pink-400/10', href: '/admin/transactions' },
    { label: 'Live Matches', value: liveMatches.toString(), sub: 'Currently live', icon: Swords, color: 'text-red-400', bg: 'bg-red-400/10', href: '/admin/matches' },
  ]

  return (
    <div className="p-6 max-w-7xl">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Platform overview · IPL Trading</p>
      </div>

      {/* Pending action alerts */}
      {hasPendingActions && (
        <div className="flex flex-wrap gap-3 mb-6">
          {pendingDeposits > 0 && (
            <Link href="/admin/deposits"
              className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 hover:bg-amber-500/15 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-amber-300 font-semibold text-sm">{pendingDeposits} deposit{pendingDeposits !== 1 ? 's' : ''} awaiting approval</div>
                <div className="text-amber-600 text-xs">Click to review and approve</div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-500 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          )}
          {pendingWithdrawals > 0 && (
            <Link href="/admin/withdrawals"
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 hover:bg-red-500/15 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                <Clock className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <div className="text-red-300 font-semibold text-sm">{pendingWithdrawals} withdrawal{pendingWithdrawals !== 1 ? 's' : ''} pending</div>
                <div className="text-red-600 text-xs">Users waiting for payout</div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-red-500 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href}
            className="stat-card hover:border-white/10 transition-colors group">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-xs font-medium">{stat.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className="font-display font-bold text-2xl text-white mt-1">{stat.value}</div>
            <div className="text-gray-600 text-xs">{stat.sub}</div>
          </Link>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-white text-sm">Recent Transactions</h2>
            <p className="text-gray-600 text-xs mt-0.5">Latest platform activity</p>
          </div>
          <Link href="/admin/transactions"
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
            View all <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-600 text-xs border-b border-white/[0.05]">
                <th className="text-left pb-3 font-medium">User</th>
                <th className="text-left pb-3 font-medium">Type</th>
                <th className="text-right pb-3 font-medium">Amount</th>
                <th className="text-right pb-3 font-medium hidden sm:table-cell">Balance</th>
                <th className="text-right pb-3 font-medium hidden md:table-cell">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map(tx => (
                <tr key={tx.id} className="border-b border-white/[0.03]">
                  <td className="py-3">
                    <div className="text-gray-200 text-xs font-medium">{tx.user?.name}</div>
                    <div className="text-gray-600 text-[10px]">{tx.user?.email}</div>
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${
                      ['deposit', 'bonus', 'trade_win', 'bet_win', 'refund'].includes(tx.type)
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {tx.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className={`text-sm font-semibold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                    </span>
                  </td>
                  <td className="py-3 text-right text-gray-500 text-xs hidden sm:table-cell">
                    {formatCurrency(tx.balance)}
                  </td>
                  <td className="py-3 text-right text-gray-600 text-[10px] hidden md:table-cell">
                    {formatDateTime(tx.createdAt)}
                  </td>
                </tr>
              ))}
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-600 text-sm">No transactions yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
