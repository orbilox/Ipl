'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Loader2, Plus, RefreshCw, Lock, Unlock, Edit3, Check } from 'lucide-react'
import { cn, formatCurrency, formatDateTime, getStatusColor } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminMatchesPage() {
  const [editingMatch, setEditingMatch] = useState<any>(null)
  const [scoreUpdate, setScoreUpdate] = useState<any>({})

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-matches'],
    queryFn: () => fetch('/api/admin/matches').then(r => r.json()),
    refetchInterval: 30000,
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/admin/matches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success('Match updated!')
      setEditingMatch(null)
      refetch()
    }
  })

  function handleUpdate(matchId: string, extra: any = {}) {
    updateMutation.mutate({ matchId, ...scoreUpdate, ...extra })
  }

  const matches = data?.matches || []

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-white">Match Management</h1>
        <button onClick={() => refetch()} className="btn-secondary text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Edit Modal */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="card p-6 w-full max-w-lg my-4">
            <h3 className="font-bold text-white text-lg mb-4">
              Update: {editingMatch.team1Short} vs {editingMatch.team2Short}
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Status</label>
                <select
                  value={scoreUpdate.status || editingMatch.status}
                  onChange={e => setScoreUpdate((p: any) => ({ ...p, status: e.target.value }))}
                  className="input text-sm py-2"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Current Innings</label>
                <select
                  value={scoreUpdate.currentInnings || editingMatch.currentInnings}
                  onChange={e => setScoreUpdate((p: any) => ({ ...p, currentInnings: parseInt(e.target.value) }))}
                  className="input text-sm py-2"
                >
                  <option value={1}>1st Innings</option>
                  <option value={2}>2nd Innings</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{editingMatch.team1Short} Runs</label>
                <input type="number" placeholder="Runs" className="input text-sm py-2"
                  onChange={e => setScoreUpdate((p: any) => ({ ...p, team1Runs: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{editingMatch.team1Short} Wickets</label>
                <input type="number" placeholder="Wickets" className="input text-sm py-2"
                  onChange={e => setScoreUpdate((p: any) => ({ ...p, team1Wickets: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{editingMatch.team1Short} Overs</label>
                <input type="text" placeholder="e.g. 18.4" className="input text-sm py-2"
                  onChange={e => setScoreUpdate((p: any) => ({ ...p, team1Overs: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{editingMatch.team2Short} Runs</label>
                <input type="number" placeholder="Runs" className="input text-sm py-2"
                  onChange={e => setScoreUpdate((p: any) => ({ ...p, team2Runs: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{editingMatch.team2Short} Wickets</label>
                <input type="number" placeholder="Wickets" className="input text-sm py-2"
                  onChange={e => setScoreUpdate((p: any) => ({ ...p, team2Wickets: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{editingMatch.team2Short} Overs</label>
                <input type="text" placeholder="e.g. 12.2" className="input text-sm py-2"
                  onChange={e => setScoreUpdate((p: any) => ({ ...p, team2Overs: e.target.value }))} />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">Last Ball (e.g. "4", "6", "W", "1")</label>
              <input type="text" placeholder="Last ball result" className="input text-sm py-2"
                onChange={e => setScoreUpdate((p: any) => ({ ...p, lastBall: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{editingMatch.team1Short} Win Odds</label>
                <input type="number" step="0.05" placeholder="e.g. 1.85" className="input text-sm py-2"
                  onChange={e => setScoreUpdate((p: any) => ({ ...p, team1Odds: parseFloat(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{editingMatch.team2Short} Win Odds</label>
                <input type="number" step="0.05" placeholder="e.g. 2.20" className="input text-sm py-2"
                  onChange={e => setScoreUpdate((p: any) => ({ ...p, team2Odds: parseFloat(e.target.value) }))} />
              </div>
            </div>

            {(scoreUpdate.status === 'completed') && (
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-1 block">Winner (settle bets & trades)</label>
                <select className="input text-sm py-2"
                  onChange={e => setScoreUpdate((p: any) => ({ ...p, winnerTeam: e.target.value }))}>
                  <option value="">Select winner</option>
                  <option value={editingMatch.team1Short}>{editingMatch.team1Short}</option>
                  <option value={editingMatch.team2Short}>{editingMatch.team2Short}</option>
                </select>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block mt-2">Result Text</label>
                  <input type="text" placeholder="e.g. MI won by 15 runs" className="input text-sm py-2"
                    onChange={e => setScoreUpdate((p: any) => ({ ...p, result: e.target.value }))} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleUpdate(editingMatch.id)}
                disabled={updateMutation.isPending}
                className="btn-primary flex items-center justify-center gap-2 text-sm py-2.5"
              >
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Update Match
              </button>
              <button onClick={() => { setEditingMatch(null); setScoreUpdate({}) }} className="btn-secondary text-sm py-2.5">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
      ) : (
        <div className="space-y-4">
          {matches.map((match: any) => (
            <div key={match.id} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={cn('badge text-xs', getStatusColor(match.status))}>
                    {match.status.toUpperCase()}
                  </span>
                  <span className="text-gray-400 text-xs">Match {match.matchNumber}</span>
                  {match.isLocked && <span className="badge bg-red-500/10 text-red-400 text-xs">🔒 Locked</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateMutation.mutate({ matchId: match.id, isLocked: !match.isLocked })}
                    className="btn-ghost text-xs px-2 py-1"
                    title={match.isLocked ? 'Unlock trading' : 'Lock trading'}
                  >
                    {match.isLocked ? <Unlock className="w-4 h-4 text-green-400" /> : <Lock className="w-4 h-4 text-red-400" />}
                  </button>
                  <button onClick={() => { setEditingMatch(match); setScoreUpdate({}) }} className="btn-ghost text-xs px-2 py-1">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 items-center text-center">
                <div>
                  <div className="font-bold text-white">{match.team1Short}</div>
                  <div className="text-gray-400 text-xs">{match.team1Score || '—'}</div>
                  <div className="text-orange-400 text-xs">{match.team1Odds}x</div>
                </div>
                <div className="text-gray-500">vs</div>
                <div>
                  <div className="font-bold text-white">{match.team2Short}</div>
                  <div className="text-gray-400 text-xs">{match.team2Score || '—'}</div>
                  <div className="text-blue-400 text-xs">{match.team2Odds}x</div>
                </div>
              </div>

              {match.result && (
                <div className="text-center text-xs text-gray-400 mt-2">{match.result}</div>
              )}

              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>📍 {match.city} · {formatDateTime(match.startTime)}</span>
                <span>{match._count?.trades} trades · {match._count?.bets} bets</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
