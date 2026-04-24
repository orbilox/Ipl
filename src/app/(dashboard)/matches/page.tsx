'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import TopBar from '@/components/layout/TopBar'
import Link from 'next/link'
import { Zap, Clock, CheckCircle, Filter } from 'lucide-react'
import { cn, formatCurrency, getMatchTimeStatus, getStatusColor, formatDateTime } from '@/lib/utils'

const tabs = [
  { value: '', label: 'All', icon: Filter },
  { value: 'live', label: 'Live', icon: Zap },
  { value: 'upcoming', label: 'Upcoming', icon: Clock },
  { value: 'completed', label: 'Completed', icon: CheckCircle },
]

export default function MatchesPage() {
  const [activeTab, setActiveTab] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['matches', activeTab],
    queryFn: () => fetch(`/api/matches?${activeTab ? `status=${activeTab}` : ''}`).then(r => r.json()),
    refetchInterval: activeTab === 'live' ? 15000 : 60000,
  })

  const matches = data?.matches || []

  return (
    <>
      <TopBar title="Matches" />
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-900/50 p-1 rounded-xl overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                activeTab === tab.value
                  ? 'bg-orange-500 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {tab.value === 'live' && activeTab === 'live' && (
                <div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }} />
              )}
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-1/3 mb-4" />
                <div className="h-12 bg-gray-800 rounded" />
              </div>
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No matches found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match: any) => (
              <FullMatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function FullMatchCard({ match }: { match: any }) {
  const team1WinProb = Math.round((1 / match.team1Odds) * 100)
  const team2WinProb = Math.round((1 / match.team2Odds) * 100)

  return (
    <div className="card-hover p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {match.status === 'live' ? (
            <span className="badge-live"><div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }} />LIVE</span>
          ) : (
            <span className={cn('badge', getStatusColor(match.status))}>
              {getMatchTimeStatus(match.startTime, match.status)}
            </span>
          )}
          <span className="text-gray-500 text-xs">{match.series}</span>
          {match.matchNumber && <span className="text-gray-600 text-xs">· Match {match.matchNumber}</span>}
        </div>
        <span className="text-gray-500 text-xs">📍 {match.city}</span>
      </div>

      {/* Teams */}
      <div className="grid grid-cols-3 items-center mb-4">
        {/* Team 1 */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center font-bold text-white text-sm">
            {match.team1Short}
          </div>
          <span className="text-white font-semibold text-sm">{match.team1Short}</span>
          {match.status !== 'upcoming' && match.team1Score && (
            <span className="text-gray-300 text-xs font-medium">{match.team1Score}</span>
          )}
          {match.status === 'upcoming' && (
            <span className="text-orange-400 text-sm font-bold">{match.team1Odds}x</span>
          )}
        </div>

        {/* VS / Score info */}
        <div className="text-center">
          {match.status === 'live' ? (
            <div>
              <div className="text-gray-500 text-xs mb-1">vs</div>
              {match.requiredRuns && (
                <div className="text-orange-400 text-xs text-center">
                  Need {match.requiredRuns} in {match.requiredOvers} ov
                </div>
              )}
            </div>
          ) : match.status === 'completed' ? (
            <div className="text-gray-400 text-xs">vs</div>
          ) : (
            <div className="text-gray-500 font-medium">vs</div>
          )}
        </div>

        {/* Team 2 */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center font-bold text-white text-sm">
            {match.team2Short}
          </div>
          <span className="text-white font-semibold text-sm">{match.team2Short}</span>
          {match.status !== 'upcoming' && match.team2Score && (
            <span className="text-gray-300 text-xs font-medium">{match.team2Score}</span>
          )}
          {match.status === 'upcoming' && (
            <span className="text-blue-400 text-sm font-bold">{match.team2Odds}x</span>
          )}
        </div>
      </div>

      {/* Win probability bar */}
      {match.status !== 'completed' && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{team1WinProb}%</span>
            <span className="text-gray-600">Win Probability</span>
            <span>{team2WinProb}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
            <div className="bg-orange-500 rounded-l-full transition-all" style={{ width: `${team1WinProb}%` }} />
            <div className="bg-blue-500 rounded-r-full transition-all" style={{ width: `${team2WinProb}%` }} />
          </div>
        </div>
      )}

      {/* Result */}
      {match.result && (
        <div className="text-center text-sm text-gray-400 mb-4 py-2 bg-gray-800/30 rounded-lg">
          🏆 {match.result}
        </div>
      )}

      {/* Actions */}
      {match.status !== 'completed' && !match.isLocked && (
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/matches/${match.id}?tab=trade`}
            className="btn-primary text-center text-sm py-2.5"
          >
            Trade Now
          </Link>
          <Link
            href={`/matches/${match.id}?tab=bet`}
            className="btn-secondary text-center text-sm py-2.5"
          >
            Place Bet
          </Link>
        </div>
      )}

      {match.isLocked && (
        <div className="text-center text-gray-500 text-sm py-2 bg-gray-800/30 rounded-lg">
          🔒 Trading locked for this match
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
        <span>{match._count?.trades || 0} trades · {match._count?.bets || 0} bets</span>
        {match.status !== 'completed' && (
          <Link href={`/matches/${match.id}?tab=contest`} className="text-orange-400 hover:text-orange-300">
            View Contests →
          </Link>
        )}
      </div>
    </div>
  )
}
