'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, Wallet, Trophy, Target, Zap, Clock, ChevronRight, Plus } from 'lucide-react'
import { formatTokens, formatDateTime, getMatchTimeStatus, getStatusColor, cn, timeAgo } from '@/lib/utils'

interface Props {
  user: any
  liveMatches: any[]
  upcomingMatches: any[]
  recentBets: any[]
  recentTrades: any[]
  notifications: any[]
  userName: string
}

export default function DashboardClient({
  user, liveMatches, upcomingMatches, recentBets, recentTrades, notifications, userName
}: Props) {
  const netPnl = (user?.totalWon || 0) - (user?.totalLost || 0)
  const winRate = user?._count?.trades > 0
    ? Math.round((user.totalWon / (user.totalWon + user.totalLost)) * 100)
    : 0

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-white">
          Hey {userName?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {liveMatches.length > 0
            ? `${liveMatches.length} match${liveMatches.length > 1 ? 'es' : ''} live right now — trade now!`
            : 'No live matches right now. Check upcoming matches below.'}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">Token Balance</span>
            <Wallet className="w-4 h-4 text-orange-400" />
          </div>
          <div className="font-display font-bold text-xl text-white">{formatTokens(user?.balance || 0)}</div>
          <Link href="/wallet" className="text-orange-400 text-xs flex items-center gap-1 mt-1">
            <Plus className="w-3 h-3" /> Buy Tokens
          </Link>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">Net P&L</span>
            {netPnl >= 0
              ? <TrendingUp className="w-4 h-4 text-green-400" />
              : <TrendingDown className="w-4 h-4 text-red-400" />}
          </div>
          <div className={cn('font-display font-bold text-xl', netPnl >= 0 ? 'text-green-400' : 'text-red-400')}>
            {netPnl >= 0 ? '+' : ''}{formatTokens(netPnl)}
          </div>
          <div className="text-gray-500 text-xs">All time earnings</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">Total Trades</span>
            <Target className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-display font-bold text-xl text-white">{user?._count?.trades || 0}</div>
          <div className="text-gray-500 text-xs">{user?._count?.bets || 0} bets placed</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">Contests Joined</span>
            <Trophy className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="font-display font-bold text-xl text-white">{user?._count?.contestEntries || 0}</div>
          <div className="text-gray-500 text-xs">{winRate}% win rate</div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="mb-6 space-y-2">
          {notifications.slice(0, 2).map(n => (
            <div key={n.id} className={cn(
              'flex items-start gap-3 p-3 rounded-xl border',
              n.type === 'success' ? 'bg-green-500/5 border-green-500/20' :
              n.type === 'error' ? 'bg-red-500/5 border-red-500/20' :
              'bg-blue-500/5 border-blue-500/20'
            )}>
              <div className={cn('w-2 h-2 rounded-full mt-1.5',
                n.type === 'success' ? 'bg-green-500' :
                n.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{n.title}</p>
                <p className="text-gray-400 text-xs">{n.message}</p>
              </div>
              <span className="text-gray-500 text-xs whitespace-nowrap">{timeAgo(n.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Live Matches */}
        <div className="lg:col-span-2">
          {liveMatches.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <div className="live-dot" />
                  Live Now
                </h2>
                <Link href="/matches?status=live" className="text-orange-400 text-xs flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {liveMatches.map(match => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Upcoming Matches
              </h2>
              <Link href="/matches" className="text-orange-400 text-xs flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingMatches.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Quick actions */}
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Buy Tokens', href: '/wallet', icon: Wallet, color: 'text-green-400 bg-green-400/10' },
                { label: 'Trade Now', href: '/matches', icon: TrendingUp, color: 'text-orange-400 bg-orange-400/10' },
                { label: 'Contests', href: '/contests', icon: Trophy, color: 'text-yellow-400 bg-yellow-400/10' },
                { label: 'Portfolio', href: '/portfolio', icon: Target, color: 'text-blue-400 bg-blue-400/10' },
              ].map(action => (
                <Link key={action.label} href={action.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-900/50 hover:bg-gray-800/50 transition-colors border border-gray-800/50 hover:border-gray-700/50">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', action.color)}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-gray-300">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Recent Activity</h3>
              <Link href="/portfolio" className="text-orange-400 text-xs">View all</Link>
            </div>
            <div className="space-y-3">
              {[...recentTrades.slice(0, 2), ...recentBets.slice(0, 2)].length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No activity yet. Start trading!</p>
              ) : (
                [...recentTrades.slice(0, 2), ...recentBets.slice(0, 2)].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <div className="text-white text-sm">
                        {'tradeType' in item ? `${item.match?.team1Short} vs ${item.match?.team2Short}` : item.betCategory}
                      </div>
                      <div className="text-gray-500 text-xs">{timeAgo(item.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className={cn('text-sm font-medium',
                        item.status === 'won' ? 'text-green-400' :
                        item.status === 'lost' ? 'text-red-400' : 'text-yellow-400'
                      )}>
                        {item.status === 'won' ? '+' : ''}{formatTokens(item.status === 'won' ? item.potentialWin : -item.amount)}
                      </div>
                      <div className={cn('badge text-[10px]', getStatusColor(item.status))}>
                        {item.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MatchCard({ match }: { match: any }) {
  return (
    <Link href={`/matches/${match.id}`} className="card-hover p-4 block group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn('badge text-xs', getStatusColor(match.status))}>
            {match.status === 'live' ? (
              <><div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }} />LIVE</>
            ) : getMatchTimeStatus(match.startTime, match.status)}
          </span>
          <span className="text-gray-500 text-xs">{match.series}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>1.{(match.team1Odds * 100 - 100).toFixed(0)}x</span>
          <span>vs</span>
          <span>1.{(match.team2Odds * 100 - 100).toFixed(0)}x</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-xs font-bold text-white">
            {match.team1Short}
          </div>
          <div>
            <div className="text-white font-semibold text-sm">{match.team1Short}</div>
            {match.status === 'live' && match.team1Score && (
              <div className="text-gray-400 text-xs">{match.team1Score}</div>
            )}
          </div>
        </div>

        <div className="text-gray-500 text-sm font-medium">vs</div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-white font-semibold text-sm">{match.team2Short}</div>
            {match.status === 'live' && match.team2Score && (
              <div className="text-gray-400 text-xs">{match.team2Score}</div>
            )}
          </div>
          <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-xs font-bold text-white">
            {match.team2Short}
          </div>
        </div>
      </div>

      {match.status === 'live' && match.requiredRuns && (
        <div className="mt-3 text-center text-xs text-orange-400">
          {match.team2Short} need {match.requiredRuns} runs in {match.requiredOvers} overs
        </div>
      )}

      {match.result && (
        <div className="mt-2 text-center text-xs text-gray-400">{match.result}</div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-800/50 flex items-center justify-between text-xs text-gray-500">
        <span>📍 {match.city}</span>
        <span className="text-orange-400 group-hover:underline">Trade Now →</span>
      </div>
    </Link>
  )
}
