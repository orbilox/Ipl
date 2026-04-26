'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Users, Trophy, Star, Loader2, CheckCircle, Crown } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { cn, formatTokens, getMatchTimeStatus } from '@/lib/utils'

const TOTAL_CREDITS = 100
const MIN_PLAYERS = 11

interface Props {
  contest: any
  players: any[]
  userEntry: any
  prizeBreakdown: any[]
  currentUserId?: string
  userBalance: number
}

export default function ContestDetailClient({ contest, players, userEntry, prizeBreakdown, currentUserId, userBalance }: Props) {
  const { update } = useSession()
  const [view, setView] = useState<'info' | 'team' | 'leaderboard'>('info')
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [captain, setCaptain] = useState('')
  const [viceCaptain, setViceCaptain] = useState('')
  const [teamName, setTeamName] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [filterRole, setFilterRole] = useState('')

  const teams = [...new Set(players.map(p => p.team))]
  const roles = ['batsman', 'bowler', 'allrounder', 'wicketkeeper']

  const filteredPlayers = players.filter(p => {
    if (filterTeam && p.team !== filterTeam) return false
    if (filterRole && p.role !== filterRole) return false
    return true
  })

  const selectedPlayersData = players.filter(p => selectedPlayers.includes(p.id))
  const totalCredits = selectedPlayersData.reduce((sum, p) => sum + p.creditValue, 0)
  const creditsLeft = TOTAL_CREDITS - totalCredits

  function togglePlayer(playerId: string) {
    const player = players.find(p => p.id === playerId)
    if (!player) return

    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(prev => prev.filter(id => id !== playerId))
      if (captain === playerId) setCaptain('')
      if (viceCaptain === playerId) setViceCaptain('')
    } else {
      if (selectedPlayers.length >= 11) { toast.error('Maximum 11 players allowed'); return }
      const newTotal = totalCredits + player.creditValue
      if (newTotal > TOTAL_CREDITS) { toast.error(`Not enough credits. Need ${player.creditValue - creditsLeft} more`); return }
      setSelectedPlayers(prev => [...prev, playerId])
    }
  }

  const joinMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/contests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
    onSuccess: async (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success('🎉 Successfully joined contest!')
      if (contest.entryFee > 0) {
        await update({ balance: userBalance - contest.entryFee })
      }
      setView('leaderboard')
    }
  })

  function handleJoin() {
    if (selectedPlayers.length !== 11) { toast.error('Select exactly 11 players'); return }
    if (!captain) { toast.error('Select a captain'); return }
    if (!viceCaptain) { toast.error('Select a vice-captain'); return }
    if (!teamName.trim()) { toast.error('Enter your team name'); return }
    if (userBalance < contest.entryFee) { toast.error('Insufficient balance'); return }

    joinMutation.mutate({
      contestId: contest.id,
      teamName: teamName.trim(),
      players: selectedPlayers,
      captain,
      viceCaptain,
    })
  }

  const fillPercent = Math.round((contest.currentParticipants / contest.maxParticipants) * 100)

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <Link href="/contests" className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Contests
      </Link>

      {/* Contest Header */}
      <div className="card p-5 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <span className={cn('badge',
                contest.match?.status === 'live' ? 'badge-live' : 'badge-upcoming'
              )}>
                {contest.match?.status === 'live' ? 'LIVE' : getMatchTimeStatus(contest.match?.startTime, contest.match?.status)}
              </span>
              <span>{contest.match?.team1Short} vs {contest.match?.team2Short}</span>
            </div>
            <h1 className="font-bold text-xl text-white">{contest.name}</h1>
          </div>
          <div className="text-right">
            <div className="font-bold text-2xl text-white">
              {contest.entryFee === 0 ? 'FREE' : `🪙 ${contest.entryFee}`}
            </div>
            <div className="text-gray-400 text-xs">Entry</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="font-bold text-xl text-gradient-gold">
              {contest.totalPrizePool >= 100000
                ? `🪙 ${(contest.totalPrizePool/100000).toFixed(1)}L`
                : `🪙 ${contest.totalPrizePool.toLocaleString()}`}
            </div>
            <div className="text-gray-400 text-xs">Prize Pool</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-xl text-white">{contest.currentParticipants.toLocaleString()}</div>
            <div className="text-gray-400 text-xs">Teams Joined</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-xl text-white">{contest.maxParticipants.toLocaleString()}</div>
            <div className="text-gray-400 text-xs">Max Teams</div>
          </div>
        </div>

        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${fillPercent}%` }} />
        </div>

        {prizeBreakdown.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {prizeBreakdown.map((p: any) => (
              <div key={p.rank} className="flex-shrink-0 bg-gray-900/50 rounded-lg px-3 py-2 text-center">
                <div className="text-white text-xs">#{p.rank}</div>
                <div className="text-yellow-400 text-xs font-bold">🪙 {p.prize.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900/50 p-1 rounded-xl">
        {[
          { id: 'info', label: 'Info' },
          { id: 'team', label: 'Create Team' },
          { id: 'leaderboard', label: 'Leaderboard' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id as any)}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all',
              view === tab.id ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {view === 'info' && (
        <div className="space-y-4">
          {userEntry ? (
            <div className="card p-4 bg-green-500/5 border-green-500/20 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <div className="text-green-400 font-medium">You&apos;re In!</div>
                <div className="text-gray-400 text-sm">Team: {userEntry.teamName}</div>
              </div>
            </div>
          ) : (
            <button onClick={() => setView('team')} className="btn-primary w-full py-3 text-base">
              Create Team & Join
            </button>
          )}
          <div className="card p-4">
            <h3 className="font-semibold text-white mb-3">How to Play</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p>1. Select 11 players within 100 credits budget</p>
              <p>2. Pick 1 captain (2x points) and 1 vice-captain (1.5x)</p>
              <p>3. Players earn points based on real match performance</p>
              <p>4. Top teams win prizes based on the leaderboard</p>
            </div>
          </div>
        </div>
      )}

      {/* Team Creation Tab */}
      {view === 'team' && !userEntry && (
        <div>
          {/* Credits bar */}
          <div className="card p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Credits Left</span>
              <span className={cn('font-bold text-lg', creditsLeft < 0 ? 'text-red-400' : 'text-white')}>
                {creditsLeft.toFixed(1)}
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', creditsLeft < 10 ? 'bg-red-500' : 'bg-orange-500')}
                style={{ width: `${(totalCredits / TOTAL_CREDITS) * 100}%` }}
              />
            </div>
            <div className="text-gray-500 text-xs mt-1">{selectedPlayers.length}/11 players · {totalCredits.toFixed(1)}/{TOTAL_CREDITS} credits used</div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
            <button onClick={() => setFilterTeam('')} className={cn('px-3 py-1.5 rounded-lg text-xs whitespace-nowrap', !filterTeam ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400')}>All Teams</button>
            {teams.map(t => (
              <button key={t} onClick={() => setFilterTeam(filterTeam === t ? '' : t)} className={cn('px-3 py-1.5 rounded-lg text-xs whitespace-nowrap', filterTeam === t ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400')}>
                {t.split(' ').map((w: string) => w[0]).join('').slice(0, 3)}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
            <button onClick={() => setFilterRole('')} className={cn('px-3 py-1.5 rounded-lg text-xs whitespace-nowrap', !filterRole ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400')}>All Roles</button>
            {roles.map(r => (
              <button key={r} onClick={() => setFilterRole(filterRole === r ? '' : r)} className={cn('px-3 py-1.5 rounded-lg text-xs whitespace-nowrap capitalize', filterRole === r ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400')}>
                {r}
              </button>
            ))}
          </div>

          {/* Players */}
          <div className="space-y-2 mb-6">
            {filteredPlayers.map(player => {
              const isSelected = selectedPlayers.includes(player.id)
              const isCaptain = captain === player.id
              const isVC = viceCaptain === player.id
              return (
                <div key={player.id} className={cn(
                  'p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer',
                  isSelected ? 'border-orange-500/50 bg-orange-500/10' : 'border-gray-800 bg-gray-900/30 hover:border-gray-700'
                )} onClick={() => togglePlayer(player.id)}>
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs',
                    isSelected ? 'bg-orange-500' : 'bg-gray-700')}>
                    {player.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{player.name}</span>
                      {isCaptain && <span className="badge bg-yellow-500/20 text-yellow-400 text-xs">C</span>}
                      {isVC && <span className="badge bg-blue-500/20 text-blue-400 text-xs">VC</span>}
                    </div>
                    <div className="text-gray-400 text-xs">{player.team} · {player.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-orange-400 font-bold text-sm">{player.creditValue}</div>
                    <div className="text-gray-500 text-xs">pts</div>
                  </div>
                  {isSelected && (
                    <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setCaptain(captain === player.id ? '' : player.id)}
                        className={cn('text-xs px-2 py-1 rounded', isCaptain ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300')}>
                        C
                      </button>
                      <button onClick={() => setViceCaptain(viceCaptain === player.id ? '' : player.id)}
                        className={cn('text-xs px-2 py-1 rounded', isVC ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300')}>
                        VC
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Team name & submit */}
          {selectedPlayers.length === 11 && captain && viceCaptain && (
            <div className="space-y-3">
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="Enter your team name"
                className="input"
                maxLength={30}
              />
              <button
                onClick={handleJoin}
                disabled={joinMutation.isPending}
                className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
              >
                {joinMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trophy className="w-5 h-5" />}
                {joinMutation.isPending ? 'Joining...' : `Join for ${contest.entryFee === 0 ? 'Free' : formatTokens(contest.entryFee)}`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {view === 'leaderboard' && (
        <div className="space-y-3">
          {contest.entries.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No entries yet</div>
          ) : (
            contest.entries.map((entry: any, i: number) => (
              <div key={entry.id} className={cn(
                'flex items-center gap-4 p-4 card',
                entry.userId === currentUserId ? 'border-orange-500/30 bg-orange-500/5' : ''
              )}>
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-300">
                  {i + 1}
                </div>
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm',
                  entry.userId === currentUserId ? 'bg-orange-500' : 'bg-gray-700'
                )}>
                  {entry.user?.name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">
                    {entry.user?.name}
                    {entry.userId === currentUserId && <span className="text-orange-400 text-xs ml-2">(You)</span>}
                  </div>
                  <div className="text-gray-400 text-xs">{entry.teamName}</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{entry.score}</div>
                  <div className="text-gray-400 text-xs">pts</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
