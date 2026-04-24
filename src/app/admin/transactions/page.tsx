'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { cn, formatCurrency, formatDateTime } from '@/lib/utils'

const TX_TYPES = ['', 'deposit', 'withdrawal', 'trade_win', 'trade_entry', 'bet_win', 'bet_entry', 'contest_win', 'bonus', 'refund']

export default function AdminTransactionsPage() {
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-transactions', type, page],
    queryFn: () => fetch(`/api/admin/transactions?page=${page}${type ? `&type=${type}` : ''}`).then(r => r.json()),
  })

  const transactions = data?.transactions || []

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-white">Transactions</h1>
        <div className="text-gray-400 text-sm">{data?.total || 0} total</div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {TX_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
              type === t ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            )}
          >
            {t ? t.replace(/_/g, ' ') : 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/30 text-gray-400 text-xs">
                  <th className="text-left p-4 font-medium">User</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-right p-4 font-medium">Amount</th>
                  <th className="text-right p-4 font-medium hidden sm:table-cell">Balance</th>
                  <th className="text-left p-4 font-medium hidden md:table-cell">Description</th>
                  <th className="text-right p-4 font-medium hidden lg:table-cell">Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx: any) => (
                  <tr key={tx.id} className="border-b border-gray-800/30">
                    <td className="p-4">
                      <div className="text-white text-xs font-medium">{tx.user?.name}</div>
                      <div className="text-gray-500 text-xs">{tx.user?.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={cn('badge text-xs',
                        ['deposit', 'bonus', 'trade_win', 'bet_win', 'contest_win', 'refund'].includes(tx.type)
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      )}>
                        {tx.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={tx.amount > 0 ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                        {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                      </span>
                    </td>
                    <td className="p-4 text-right text-gray-400 hidden sm:table-cell">
                      {formatCurrency(tx.balance)}
                    </td>
                    <td className="p-4 text-gray-400 text-xs max-w-[200px] truncate hidden md:table-cell">
                      {tx.description}
                    </td>
                    <td className="p-4 text-right text-gray-500 text-xs hidden lg:table-cell">
                      {formatDateTime(tx.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-800 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost text-sm disabled:opacity-40"
            >
              ← Previous
            </button>
            <span className="text-gray-400 text-sm">Page {page} of {data?.pages || 1}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= (data?.pages || 1)}
              className="btn-ghost text-sm disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
