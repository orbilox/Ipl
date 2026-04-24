'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import TopBar from '@/components/layout/TopBar'
import { TrendingUp, TrendingDown, Target, Trophy, Loader2 } from 'lucide-react'
import { cn, formatCurrency, formatDateTime, getStatusColor } from '@/lib/utils'

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<'trades' | 'bets' | 'contests'>('trades')

  const { data: tradesData, isLoading: tradesLoading } = useQuery({
    queryKey: ['trades'],
    queryFn: () => fetch('/api/trades').then(r => r.json()),
  })

  const { data: betsData, isLoading: betsLoading } = useQuery({
    queryKey: ['bets'],
    queryFn: () => fetch('/api/bets').then(r => r.json()),
  })

  const trades = tradesData?.trades || []
  const bets = betsData?.bets || []

  const tradeStats = trades.reduce((acc: any, t: any) => ({
    totalInvested: acc.totalInvested + t.amount,
    totalWon: acc.totalWon + (t.status === 'won' ? t.potentialWin : 0),
    won: acc.won + (t.status === 'won' ? 1 : 0),
    lost: acc.lost + (t.status === 'lost' ? 1 : 0),
    active: acc.active + (t.status === 'active' ? 1 : 0),
  }), { totalInvested: 0, totalWon: 0, won: 0, lost: 0, active: 0 })

  return (
    <>
      <TopBar title="My Portfolio" />
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <div className="text-gray-400 text-xs">Total Trades</div>
            <div className="font-bold text-xl text-white">{trades.length}</div>
            <div className="text-gray-500 text-xs">{tradeStats.active} active</div>
          </div>
          <div className="stat-card">
            <div className="text-gray-400 text-xs">Total Invested</div>
            <div className="font-bold text-xl text-white">{formatCurrency(tradeStats.totalInvested)}</div>
          </div>
          <div className="stat-card">
            <div className="text-gray-400 text-xs">Won</div>
            <div className="font-bold text-xl text-green-400">{tradeStats.won}</div>
            <div className="text-gray-500 text-xs">trades</div>
          </div>
          <div className="stat-card">
            <div className="text-gray-400 text-xs">Lost</div>
            <div className="font-bold text-xl text-red-400">{tradeStats.lost}</div>
            <div className="text-gray-500 text-xs">trades</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900/50 p-1 rounded-xl">
          {[
            { id: 'trades', label: 'Trades', icon: TrendingUp },
            { id: 'bets', label: 'Bets', icon: Target },
            { id: 'contests', label: 'Contests', icon: Trophy },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Trades List */}
        {activeTab === 'trades' && (
          <div>
            {tradesLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
            ) : trades.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No trades yet. Start trading!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trades.map((trade: any) => (
                  <div key={trade.id} className="card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-white font-medium text-sm">
                          {trade.match?.team1Short} vs {trade.match?.team2Short}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {trade.prediction.replace(/_/g, ' ').toUpperCase()} · {trade.tradeType.replace(/_/g, ' ')}
                        </div>
                      </div>
                      <span className={cn('badge text-xs', getStatusColor(trade.status))}>
                        {trade.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 text-xs">Invested</div>
                        <div className="text-white font-medium">{formatCurrency(trade.amount)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Odds</div>
                        <div className="text-white font-medium">{trade.odds}x</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">
                          {trade.status === 'won' ? 'Won' : trade.status === 'lost' ? 'Lost' : 'Potential'}
                        </div>
                        <div className={cn('font-bold',
                          trade.status === 'won' ? 'text-green-400' :
                          trade.status === 'lost' ? 'text-red-400' : 'text-yellow-400'
                        )}>
                          {trade.status === 'won' ? '+' : trade.status === 'lost' ? '-' : ''}
                          {formatCurrency(trade.status === 'won' ? trade.potentialWin :
                           trade.status === 'lost' ? trade.amount : trade.potentialWin)}
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-600 text-xs mt-2">{formatDateTime(trade.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bets List */}
        {activeTab === 'bets' && (
          <div>
            {betsLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
            ) : bets.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No bets yet. Place your first bet!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bets.map((bet: any) => (
                  <div key={bet.id} className="card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-white font-medium text-sm">
                          {bet.match?.team1Short} vs {bet.match?.team2Short}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {bet.betCategory.replace(/_/g, ' ')} · {bet.betValue}
                        </div>
                      </div>
                      <span className={cn('badge text-xs', getStatusColor(bet.status))}>
                        {bet.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 text-xs">Staked</div>
                        <div className="text-white">{formatCurrency(bet.amount)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Odds</div>
                        <div className="text-white">{bet.odds}x</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Potential Win</div>
                        <div className={cn('font-bold',
                          bet.status === 'won' ? 'text-green-400' :
                          bet.status === 'lost' ? 'text-red-400' : 'text-yellow-400'
                        )}>
                          {formatCurrency(bet.potentialWin)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'contests' && (
          <div className="text-center py-20 text-gray-500">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No contest entries yet</p>
          </div>
        )}
      </div>
    </>
  )
}
