import TopBar from '@/components/layout/TopBar'
import { prisma } from '@/lib/db'
import { formatTokens } from '@/lib/utils'
import { Trophy, TrendingUp, Medal } from 'lucide-react'
import { cn } from '@/lib/utils'

export const revalidate = 60

export default async function LeaderboardPage() {
  const users = await prisma.user.findMany({
    where: { role: 'user', isActive: true },
    select: {
      id: true, name: true, avatar: true,
      totalWon: true, totalLost: true,
      _count: { select: { trades: true, bets: true } }
    },
    orderBy: { totalWon: 'desc' },
    take: 100,
  })

  const leaderboard = users.map((u, i) => ({
    rank: i + 1,
    ...u,
    netPnl: u.totalWon - u.totalLost,
    winRate: u._count.trades > 0 ? Math.round((u.totalWon / (u.totalWon + u.totalLost + 0.001)) * 100) : 0
  }))

  return (
    <>
      <TopBar title="Leaderboard" />
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="card p-5 mb-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20 text-center">
          <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
          <h2 className="font-display font-bold text-xl text-white">Top Traders</h2>
          <p className="text-gray-400 text-sm">All-time leaderboard — Updated live</p>
        </div>

        {/* Top 3 */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[leaderboard[1], leaderboard[0], leaderboard[2]].map((user, i) => {
              const positions = [2, 1, 3]
              const pos = positions[i]
              return (
                <div key={user.id} className={cn(
                  'card p-4 text-center',
                  pos === 1 ? 'border-yellow-500/30 bg-yellow-500/5 -translate-y-2' : ''
                )}>
                  <div className={cn('text-2xl mb-2', pos === 1 ? '' : 'mt-4')}>
                    {pos === 1 ? '🥇' : pos === 2 ? '🥈' : '🥉'}
                  </div>
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white mx-auto mb-2 text-sm',
                    pos === 1 ? 'bg-yellow-500' : pos === 2 ? 'bg-gray-400' : 'bg-orange-500'
                  )}>
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-white text-xs font-medium truncate">{user.name.split(' ')[0]}</div>
                  <div className="text-green-400 text-xs font-bold">{formatTokens(user.netPnl)}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Full list */}
        <div className="space-y-2">
          {leaderboard.map(user => (
            <div key={user.id} className={cn(
              'flex items-center gap-4 p-4 card',
              user.rank <= 3 ? 'border-yellow-500/10' : ''
            )}>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold',
                user.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                user.rank === 2 ? 'bg-gray-500/20 text-gray-300' :
                user.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                'bg-gray-800/50 text-gray-400'
              )}>
                {user.rank}
              </div>

              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                {user.name.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm truncate">{user.name}</div>
                <div className="text-gray-500 text-xs">
                  {user._count.trades + user._count.bets} games
                </div>
              </div>

              <div className="text-right">
                <div className={cn('font-bold text-sm', user.netPnl >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {user.netPnl >= 0 ? '+' : ''}{formatTokens(user.netPnl)}
                </div>
                <div className="text-gray-500 text-xs">{user.winRate}% WR</div>
              </div>
            </div>
          ))}

          {leaderboard.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No data yet. Be the first to trade!</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
