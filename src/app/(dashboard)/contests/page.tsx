'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import TopBar from '@/components/layout/TopBar'
import Link from 'next/link'
import { Trophy, Users, Clock, Star, Zap } from 'lucide-react'
import { cn, formatCurrency, getMatchTimeStatus } from '@/lib/utils'

const CONTEST_TYPES = [
  { value: '', label: 'All' },
  { value: 'mega', label: '🔥 Mega' },
  { value: 'small', label: '⚡ Small' },
  { value: 'head2head', label: '👊 H2H' },
  { value: 'practice', label: '🎮 Practice' },
]

export default function ContestsPage() {
  const [contestType, setContestType] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['contests', contestType],
    queryFn: () => fetch(`/api/contests?status=open${contestType ? `&type=${contestType}` : ''}`).then(r => r.json()),
    refetchInterval: 30000,
  })

  const contests = data?.contests || []

  return (
    <>
      <TopBar title="Contests" />
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="card p-5 mb-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h2 className="font-display font-bold text-xl text-white">Fantasy Contests</h2>
          </div>
          <p className="text-gray-400 text-sm">Select 11 players, create your team and compete for crore prizes!</p>
        </div>

        {/* Type filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
          {CONTEST_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setContestType(type.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                contestType === type.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-900/50 text-gray-400 hover:text-white border border-gray-800'
              )}
            >
              {type.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5 animate-pulse h-40" />
            ))}
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No contests available right now</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contests.map((contest: any) => (
              <ContestCard key={contest.id} contest={contest} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function ContestCard({ contest }: { contest: any }) {
  const fillPercent = Math.round((contest.currentParticipants / contest.maxParticipants) * 100)
  const prizeBreakdown = JSON.parse(contest.prizeBreakdown || '[]')

  return (
    <div className="card-hover p-5">
      {/* Match info */}
      <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
        <span className={cn('badge',
          contest.match?.status === 'live' ? 'badge-live' : 'badge-upcoming'
        )}>
          {contest.match?.status === 'live' ? (
            <><div style={{ width: 5, height: 5, background: '#10b981', borderRadius: '50%' }} />LIVE</>
          ) : getMatchTimeStatus(contest.match?.startTime, contest.match?.status)}
        </span>
        <span>{contest.match?.team1Short} vs {contest.match?.team2Short}</span>
      </div>

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {contest.isFeatured && <span className="badge bg-orange-500/10 text-orange-400 text-xs">🔥 Featured</span>}
            {contest.isGuaranteed && <span className="badge bg-green-500/10 text-green-400 text-xs">✓ Guaranteed</span>}
          </div>
          <h3 className="font-bold text-white text-lg">{contest.name}</h3>
          <div className="font-display font-black text-2xl text-gradient-gold mt-1">
            {contest.totalPrizePool >= 100000
              ? `₹${(contest.totalPrizePool/100000).toFixed(1)}L`
              : `₹${contest.totalPrizePool.toLocaleString()}`}
          </div>
          <div className="text-gray-400 text-xs">Prize Pool</div>
        </div>

        <div className="text-right">
          <div className="font-bold text-2xl text-white">
            {contest.entryFee === 0 ? 'FREE' : `₹${contest.entryFee}`}
          </div>
          <div className="text-gray-400 text-xs">Entry Fee</div>
        </div>
      </div>

      {/* Prize breakdown */}
      {prizeBreakdown.length > 0 && (
        <div className="flex gap-3 mb-4 overflow-x-auto scrollbar-hide pb-1">
          {prizeBreakdown.slice(0, 3).map((p: any, i: number) => (
            <div key={i} className="flex-shrink-0 text-center bg-gray-900/50 rounded-lg px-3 py-2">
              <div className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
              <div className="text-white text-xs font-medium">#{p.rank}</div>
              <div className="text-yellow-400 text-xs">₹{p.prize.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {/* Fill bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {contest.currentParticipants.toLocaleString()} teams
          </span>
          <span>{contest.maxParticipants.toLocaleString()} spots</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full', fillPercent > 80 ? 'bg-red-500' : 'bg-orange-500')}
            style={{ width: `${Math.min(fillPercent, 100)}%` }}
          />
        </div>
      </div>

      <Link
        href={`/contests/${contest.id}`}
        className="btn-primary w-full text-center block py-3"
      >
        {contest.contestType === 'practice' ? 'Practice Free' : 'Join Contest'}
      </Link>
    </div>
  )
}
