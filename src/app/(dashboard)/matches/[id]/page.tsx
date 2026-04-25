'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useSearchParams, useParams } from 'next/navigation'
import { ArrowLeft, TrendingUp, Target, Trophy, Loader2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { cn, formatCurrency, getStatusColor } from '@/lib/utils'
import TopBar from '@/components/layout/TopBar'
import LiveScoreWidget from '@/components/match/LiveScoreWidget'

const TRADE_OPTIONS = [
  { id: 'team1_win', label: 'Team 1 Wins', type: 'match_winner', description: 'Team 1 wins the match' },
  { id: 'team2_win', label: 'Team 2 Wins', type: 'match_winner', description: 'Team 2 wins the match' },
  { id: 'over_150', label: 'Team 1 Over 150', type: 'over_under', description: 'Team 1 scores 150+ runs' },
  { id: 'under_150', label: 'Team 1 Under 150', type: 'over_under', description: 'Team 1 scores less than 150' },
  { id: 'over_6', label: '6+ Sixers Total', type: 'sixers', description: 'Total 6+ sixes in the match' },
  { id: 'first_wicket_10', label: 'First Wicket >10', type: 'first_wicket', description: 'First wicket falls after 10 runs' },
]

const BET_CATEGORIES = [
  {
    id: 'match_winner', label: 'Match Winner', icon: '🏆',
    options: [] // populated from match data
  },
  {
    id: 'total_runs', label: 'Total Runs', icon: '🏏',
    options: [
      { label: 'Over 300', value: 'over_300', odds: 1.9 },
      { label: 'Under 300', value: 'under_300', odds: 2.0 },
      { label: 'Over 320', value: 'over_320', odds: 2.2 },
      { label: 'Under 320', value: 'under_320', odds: 1.75 },
    ]
  },
  {
    id: 'total_wickets', label: 'Total Wickets', icon: '🎳',
    options: [
      { label: 'Over 12', value: 'over_12', odds: 1.85 },
      { label: 'Under 12', value: 'under_12', odds: 2.05 },
      { label: 'Over 15', value: 'over_15', odds: 2.1 },
      { label: 'Under 15', value: 'under_15', odds: 1.8 },
    ]
  },
  {
    id: 'top_batsman', label: 'Top Batsman', icon: '⭐',
    options: [
      { label: 'Virat Kohli 50+', value: 'kohli_50', odds: 2.5 },
      { label: 'Rohit Sharma 50+', value: 'rohit_50', odds: 2.8 },
      { label: 'MS Dhoni 30+', value: 'dhoni_30', odds: 2.2 },
    ]
  },
  {
    id: 'sixers', label: 'Total Sixes', icon: '💥',
    options: [
      { label: 'Over 10 sixes', value: 'over_10', odds: 1.95 },
      { label: 'Under 10 sixes', value: 'under_10', odds: 1.95 },
      { label: 'Over 15 sixes', value: 'over_15_six', odds: 2.3 },
    ]
  },
]

export default function MatchDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { data: session, update } = useSession()
  const queryClient = useQueryClient()
  const initialTab = searchParams.get('tab') || 'trade'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [selectedTrade, setSelectedTrade] = useState<any>(null)
  const [selectedBet, setSelectedBet] = useState<any>(null)
  const [tradeAmount, setTradeAmount] = useState('')
  const [betAmount, setBetAmount] = useState('')
  const [selectedBetCategory, setSelectedBetCategory] = useState('match_winner')
  const [liveOdds, setLiveOdds] = useState<{ team1: number; team2: number } | null>(null)

  const handleOddsChange = useCallback((team1Odds: number, team2Odds: number) => {
    setLiveOdds({ team1: team1Odds, team2: team2Odds })
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['match', params.id],
    queryFn: () => fetch(`/api/matches/${params.id}`).then(r => r.json()),
    refetchInterval: 15000,
  })

  const match = data?.match

  const tradeMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success('Trade placed successfully! 🏏')
      setSelectedTrade(null)
      setTradeAmount('')
      queryClient.invalidateQueries({ queryKey: ['match'] })
      update({ balance: (session?.user?.balance || 0) - parseFloat(tradeAmount) })
    },
    onError: () => toast.error('Failed to place trade')
  })

  const betMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success('Bet placed successfully! 🎯')
      setSelectedBet(null)
      setBetAmount('')
      update({ balance: (session?.user?.balance || 0) - parseFloat(betAmount) })
    },
    onError: () => toast.error('Failed to place bet')
  })

  if (isLoading) {
    return (
      <>
        <TopBar />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
        </div>
      </>
    )
  }

  if (!match) {
    return (
      <>
        <TopBar />
        <div className="text-center py-20 text-gray-500">Match not found</div>
      </>
    )
  }

  const matchBetCategories = [
    {
      id: 'match_winner', label: 'Match Winner', icon: '🏆',
      options: [
        { label: match.team1, value: match.team1Short, odds: match.team1Odds },
        { label: match.team2, value: match.team2Short, odds: match.team2Odds },
      ]
    },
    ...BET_CATEGORIES.filter(c => c.id !== 'match_winner')
  ]

  function handlePlaceTrade() {
    if (!selectedTrade || !tradeAmount) { toast.error('Select a prediction and amount'); return }
    const amount = parseFloat(tradeAmount)
    if (isNaN(amount) || amount < 10) { toast.error('Minimum trade amount is ₹10'); return }
    if (amount > (session?.user?.balance || 0)) { toast.error('Insufficient balance'); return }

    tradeMutation.mutate({
      matchId: match.id,
      tradeType: selectedTrade.type,
      prediction: selectedTrade.id,
      amount,
      odds: selectedTrade.id === 'team1_win' ? (liveOdds?.team1 ?? match.team1Odds) :
            selectedTrade.id === 'team2_win' ? (liveOdds?.team2 ?? match.team2Odds) : 1.9,
    })
  }

  function handlePlaceBet() {
    if (!selectedBet || !betAmount) { toast.error('Select a bet and enter amount'); return }
    const amount = parseFloat(betAmount)
    if (isNaN(amount) || amount < 10) { toast.error('Minimum bet amount is ₹10'); return }
    if (amount > (session?.user?.balance || 0)) { toast.error('Insufficient balance'); return }

    betMutation.mutate({
      matchId: match.id,
      betCategory: selectedBetCategory,
      betType: 'specific',
      betValue: selectedBet.value,
      amount,
      odds: selectedBet.odds,
    })
  }

  return (
    <>
      <TopBar />
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        {/* Back */}
        <Link href="/matches" className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Matches
        </Link>

        {/* Match Header / Live Score */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className={cn('badge', getStatusColor(match.status))}>
              {match.status === 'live' ? (
                <><div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }} />LIVE</>
              ) : match.status.toUpperCase()}
            </span>
            <span className="text-gray-400 text-sm">{match.series} · Match {match.matchNumber}</span>
          </div>

          {match.status === 'live' ? (
            <LiveScoreWidget
              matchId={match.id}
              initialScore={{
                team1Short: match.team1Short,
                team2Short: match.team2Short,
                team1Score: match.team1Score,
                team2Score: match.team2Score,
                team1Runs: match.team1Runs,
                team1Wickets: match.team1Wickets,
                team1Overs: match.team1Overs,
                team2Runs: match.team2Runs,
                team2Wickets: match.team2Wickets,
                team2Overs: match.team2Overs,
                currentInnings: match.currentInnings || 1,
                lastBall: match.lastBall,
                requiredRuns: match.requiredRuns,
                requiredOvers: match.requiredOvers,
                result: match.result,
                status: match.status,
                team1Odds: match.team1Odds,
                team2Odds: match.team2Odds,
              }}
              onOddsChange={handleOddsChange}
            />
          ) : (
            <div className="card p-5">
              <div className="grid grid-cols-3 items-center text-center">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center font-bold text-white text-lg mx-auto mb-2">
                    {match.team1Short}
                  </div>
                  <div className="font-bold text-white">{match.team1Short}</div>
                  <div className="text-gray-300 text-sm font-medium">{match.team1Score || '—'}</div>
                  <div className="text-orange-400 text-sm font-bold mt-1">{liveOdds?.team1 ?? match.team1Odds}x</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500 text-lg font-medium">vs</div>
                  {match.result && (
                    <div className="text-xs text-green-400 mt-2">{match.result}</div>
                  )}
                </div>
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center font-bold text-white text-lg mx-auto mb-2">
                    {match.team2Short}
                  </div>
                  <div className="font-bold text-white">{match.team2Short}</div>
                  <div className="text-gray-300 text-sm font-medium">{match.team2Score || '—'}</div>
                  <div className="text-blue-400 text-sm font-bold mt-1">{liveOdds?.team2 ?? match.team2Odds}x</div>
                </div>
              </div>
              <div className="mt-4 text-center text-xs text-gray-500">
                📍 {match.venue}, {match.city}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        {match.status !== 'completed' && !match.isLocked && (
          <div className="flex gap-1 mb-6 bg-gray-900/50 p-1 rounded-xl">
            {[
              { id: 'trade', label: 'Trade', icon: TrendingUp },
              { id: 'bet', label: 'Bet', icon: Target },
              { id: 'contest', label: 'Contests', icon: Trophy },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
        )}

        {/* Trade Panel */}
        {activeTab === 'trade' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-white mb-4">Select Your Prediction</h3>
              <div className="space-y-3">
                {TRADE_OPTIONS.map(option => {
                  const odds = option.id === 'team1_win' ? (liveOdds?.team1 ?? match.team1Odds) :
                               option.id === 'team2_win' ? (liveOdds?.team2 ?? match.team2Odds) : 1.9
                  const displayOpts = {
                    ...option,
                    label: option.id === 'team1_win' ? `${match.team1Short} Wins` :
                           option.id === 'team2_win' ? `${match.team2Short} Wins` : option.label
                  }
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSelectedTrade(option)}
                      className={cn(
                        'w-full p-4 rounded-xl border text-left transition-all',
                        selectedTrade?.id === option.id
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white text-sm">{displayOpts.label}</div>
                          <div className="text-gray-400 text-xs mt-0.5">{option.description}</div>
                        </div>
                        <div className="text-orange-400 font-bold">{odds}x</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Place Trade</h3>
              <div className="card p-5">
                {selectedTrade ? (
                  <div className="mb-4 p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                    <div className="text-white font-medium text-sm">{selectedTrade.label}</div>
                    <div className="text-orange-400 text-xs mt-1">Odds: {
                      selectedTrade.id === 'team1_win' ? (liveOdds?.team1 ?? match.team1Odds) :
                      selectedTrade.id === 'team2_win' ? (liveOdds?.team2 ?? match.team2Odds) : '1.90'
                    }x</div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-gray-900/50 rounded-xl border border-gray-800 text-gray-500 text-sm text-center">
                    Select a prediction to continue
                  </div>
                )}

                <div className="mb-4">
                  <label className="text-sm text-gray-400 mb-2 block">Trade Amount (₹)</label>
                  <input
                    type="number"
                    value={tradeAmount}
                    onChange={e => setTradeAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="input"
                    min={10}
                    max={session?.user?.balance || 0}
                  />
                  <div className="flex gap-2 mt-2">
                    {[100, 500, 1000, 5000].map(amt => (
                      <button key={amt}
                        onClick={() => setTradeAmount(String(Math.min(amt, session?.user?.balance || 0)))}
                        className="flex-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 rounded-lg transition-colors">
                        ₹{amt >= 1000 ? `${amt/1000}K` : amt}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedTrade && tradeAmount && parseFloat(tradeAmount) > 0 && (
                  <div className="mb-4 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Potential Win</span>
                      <span className="text-green-400 font-bold">
                        {formatCurrency(parseFloat(tradeAmount) * (
                          selectedTrade.id === 'team1_win' ? (liveOdds?.team1 ?? match.team1Odds) :
                          selectedTrade.id === 'team2_win' ? (liveOdds?.team2 ?? match.team2Odds) : 1.9
                        ))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-400">Profit</span>
                      <span className="text-green-400">
                        +{formatCurrency(parseFloat(tradeAmount) * (
                          selectedTrade.id === 'team1_win' ? (liveOdds?.team1 ?? match.team1Odds) - 1 :
                          selectedTrade.id === 'team2_win' ? (liveOdds?.team2 ?? match.team2Odds) - 1 : 0.9
                        ))}
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 mb-4">
                  Balance: {formatCurrency(session?.user?.balance || 0)}
                </div>

                <button
                  onClick={handlePlaceTrade}
                  disabled={tradeMutation.isPending || !selectedTrade || !tradeAmount}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {tradeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {tradeMutation.isPending ? 'Placing Trade...' : 'Place Trade'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bet Panel */}
        {activeTab === 'bet' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
                {matchBetCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedBetCategory(cat.id); setSelectedBet(null) }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                      selectedBetCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                    )}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {matchBetCategories
                  .find(c => c.id === selectedBetCategory)?.options
                  .map((option: any) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedBet(option)}
                      className={cn(
                        'w-full p-4 rounded-xl border text-left transition-all',
                        selectedBet?.value === option.value
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white text-sm">{option.label}</span>
                        <span className="text-orange-400 font-bold">{option.odds}x</span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Place Bet</h3>
              <div className="card p-5">
                {selectedBet ? (
                  <div className="mb-4 p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                    <div className="text-white font-medium text-sm">{selectedBet.label}</div>
                    <div className="text-orange-400 text-xs mt-1">Odds: {selectedBet.odds}x</div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-gray-900/50 rounded-xl border border-gray-800 text-gray-500 text-sm text-center">
                    Select a bet option to continue
                  </div>
                )}

                <div className="mb-4">
                  <label className="text-sm text-gray-400 mb-2 block">Bet Amount (₹)</label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={e => setBetAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="input"
                    min={10}
                  />
                  <div className="flex gap-2 mt-2">
                    {[50, 100, 500, 1000].map(amt => (
                      <button key={amt}
                        onClick={() => setBetAmount(String(Math.min(amt, session?.user?.balance || 0)))}
                        className="flex-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 rounded-lg transition-colors">
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedBet && betAmount && parseFloat(betAmount) > 0 && (
                  <div className="mb-4 p-3 bg-green-500/5 border border-green-500/20 rounded-xl text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Potential Win</span>
                      <span className="text-green-400 font-bold">
                        {formatCurrency(parseFloat(betAmount) * selectedBet.odds)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 mb-4">
                  Balance: {formatCurrency(session?.user?.balance || 0)}
                </div>

                <button
                  onClick={handlePlaceBet}
                  disabled={betMutation.isPending || !selectedBet || !betAmount}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {betMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {betMutation.isPending ? 'Placing Bet...' : 'Place Bet'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contests */}
        {activeTab === 'contest' && (
          <div>
            <h3 className="font-semibold text-white mb-4">Available Contests</h3>
            <div className="space-y-4">
              {data?.match?.contests?.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No contests available</div>
              ) : (
                data?.match?.contests?.map((contest: any) => (
                  <ContestCard key={contest.id} contest={contest} />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function ContestCard({ contest }: { contest: any }) {
  const fillPercent = Math.round((contest.currentParticipants / contest.maxParticipants) * 100)

  return (
    <Link href={`/contests/${contest.id}`} className="card-hover p-5 block">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {contest.isFeatured && <span className="badge bg-orange-500/10 text-orange-400">🔥 Featured</span>}
            {contest.isGuaranteed && <span className="badge bg-green-500/10 text-green-400">✓ Guaranteed</span>}
            <span className="text-gray-500 text-xs">{contest.contestType}</span>
          </div>
          <h4 className="font-semibold text-white">{contest.name}</h4>
        </div>
        <div className="text-right">
          <div className="font-bold text-white text-lg">
            {contest.entryFee === 0 ? 'Free' : `₹${contest.entryFee}`}
          </div>
          <div className="text-gray-400 text-xs">Entry Fee</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-bold text-xl text-gradient-gold">₹{(contest.totalPrizePool/100000).toFixed(1)}L</div>
          <div className="text-gray-400 text-xs">Prize Pool</div>
        </div>
        <div className="text-right">
          <div className="text-white font-semibold">{contest.currentParticipants.toLocaleString()}</div>
          <div className="text-gray-400 text-xs">of {contest.maxParticipants.toLocaleString()}</div>
        </div>
      </div>

      <div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full', fillPercent > 80 ? 'bg-red-500' : 'bg-orange-500')}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">{fillPercent}% filled</div>
      </div>
    </Link>
  )
}
