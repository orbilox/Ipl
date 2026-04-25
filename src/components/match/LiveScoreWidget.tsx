'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface ScoreState {
  team1Short: string
  team2Short: string
  team1Score: string | null
  team2Score: string | null
  team1Runs: number | null
  team1Wickets: number | null
  team1Overs: string | null
  team2Runs: number | null
  team2Wickets: number | null
  team2Overs: string | null
  currentInnings: number
  lastBall: string | null
  requiredRuns: number | null
  requiredOvers: string | null
  result: string | null
  status: string
  team1Odds: number
  team2Odds: number
}

interface Props {
  matchId: string
  initialScore: ScoreState
  onOddsChange?: (team1Odds: number, team2Odds: number) => void
}

const BALL_COLORS: Record<string, string> = {
  '4': 'bg-blue-500',
  '6': 'bg-orange-500',
  'W': 'bg-red-500',
  'Wd': 'bg-yellow-500/80',
  'Nb': 'bg-yellow-500/80',
  '●': 'bg-gray-700',
  '1': 'bg-gray-600',
  '2': 'bg-gray-600',
  '3': 'bg-gray-500',
}

export default function LiveScoreWidget({ matchId, initialScore, onOddsChange }: Props) {
  const [score, setScore] = useState<ScoreState>(initialScore)
  const [lastBalls, setLastBalls] = useState<string[]>([])
  const [commentary, setCommentary] = useState<string>('')
  const [flashBall, setFlashBall] = useState(false)
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const es = new EventSource(`/api/live-stream?matchId=${matchId}`)
    eventSourceRef.current = es

    es.onopen = () => setConnected(true)
    es.onerror = () => setConnected(false)

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data)

        if (payload.type === 'score' && payload.match) {
          const m = payload.match
          setScore(m)

          // Track last ball events
          if (m.lastBall && m.lastBall !== score.lastBall) {
            setCommentary(m.lastBall)
            const label = extractBallLabel(m.lastBall)
            setLastBalls(prev => [...prev.slice(-5), label])
            setFlashBall(true)
            setTimeout(() => setFlashBall(false), 600)
          }
        }

        if (payload.type === 'odds') {
          onOddsChange?.(payload.team1Odds, payload.team2Odds)
        }

        if (payload.type === 'match_ended') {
          setConnected(false)
          es.close()
        }
      } catch {}
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [matchId])

  function extractBallLabel(text: string): string {
    if (text.includes('WICKET') || text.includes('Out')) return 'W'
    if (text.includes('SIX') || text.includes('six')) return '6'
    if (text.includes('FOUR') || text.includes('four') || text.includes('boundary')) return '4'
    if (text.includes('Wide')) return 'Wd'
    if (text.includes('No-ball') || text.includes('no-ball')) return 'Nb'
    if (text.includes('dot') || text.includes('Dot') || text.includes('Defended')) return '●'
    const num = text.match(/\b([123])\b/)
    return num ? num[1] : '●'
  }

  const innings2Active = score.currentInnings === 2
  const target = innings2Active && score.team1Runs ? score.team1Runs + 1 : null

  return (
    <div className="card p-4 sm:p-5">
      {/* Status bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {score.status === 'live' ? (
            <>
              <div className="live-dot" />
              <span className="text-green-400 text-xs font-bold">LIVE</span>
              {connected && (
                <span className="text-gray-600 text-xs">· streaming</span>
              )}
            </>
          ) : (
            <span className="text-gray-400 text-xs">{score.status.toUpperCase()}</span>
          )}
        </div>
        <div className="text-gray-500 text-xs">
          Innings {score.currentInnings}/2
        </div>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-3 items-center text-center mb-4">
        {/* Team 1 */}
        <div>
          <div className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm mx-auto mb-2 transition-all',
            !innings2Active ? 'bg-orange-500 text-white scale-105' : 'bg-gray-800 text-gray-300'
          )}>
            {score.team1Short}
          </div>
          <div className="text-white font-bold">{score.team1Short}</div>
          <div className={cn(
            'font-display font-black text-2xl transition-all',
            !innings2Active ? 'text-white' : 'text-gray-400'
          )}>
            {score.team1Runs ?? 0}/{score.team1Wickets ?? 0}
          </div>
          <div className="text-gray-400 text-xs">{score.team1Overs ?? '0.0'} ov</div>
          <div className="text-orange-400 text-xs font-bold mt-1">{score.team1Odds}x</div>
        </div>

        {/* Centre */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-gray-600 text-sm font-medium">vs</div>
          {innings2Active && target && score.team2Runs !== null && (
            <div className="text-center">
              <div className="text-orange-400 text-xs font-semibold">
                Need {score.requiredRuns}
              </div>
              <div className="text-gray-500 text-xs">
                in {score.requiredOvers} ov
              </div>
            </div>
          )}
          {score.result && (
            <div className="text-green-400 text-xs text-center font-medium px-2">
              {score.result}
            </div>
          )}
        </div>

        {/* Team 2 */}
        <div>
          <div className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm mx-auto mb-2 transition-all',
            innings2Active ? 'bg-blue-500 text-white scale-105' : 'bg-gray-800 text-gray-300'
          )}>
            {score.team2Short}
          </div>
          <div className="text-white font-bold">{score.team2Short}</div>
          <div className={cn(
            'font-display font-black text-2xl transition-all',
            innings2Active ? 'text-white' : 'text-gray-400'
          )}>
            {score.team2Runs !== null ? `${score.team2Runs}/${score.team2Wickets}` : '—'}
          </div>
          <div className="text-gray-400 text-xs">{score.team2Overs ?? '—'} ov</div>
          <div className="text-blue-400 text-xs font-bold mt-1">{score.team2Odds}x</div>
        </div>
      </div>

      {/* Win probability bar */}
      {score.status === 'live' && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{Math.round((1 / score.team1Odds) * 100)}%</span>
            <span className="text-gray-600">Win Probability</span>
            <span>{Math.round((1 / score.team2Odds) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
            <div
              className="bg-orange-500 rounded-l-full transition-all duration-1000"
              style={{ width: `${Math.round((1 / score.team1Odds) * 100)}%` }}
            />
            <div
              className="bg-blue-500 rounded-r-full transition-all duration-1000"
              style={{ width: `${Math.round((1 / score.team2Odds) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Last 6 balls */}
      {lastBalls.length > 0 && (
        <div className="mb-3">
          <div className="text-gray-500 text-xs mb-2">Last {lastBalls.length} balls</div>
          <div className="flex gap-1.5">
            {lastBalls.map((b, i) => (
              <div
                key={i}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all',
                  BALL_COLORS[b] || 'bg-gray-700',
                  i === lastBalls.length - 1 && flashBall ? 'scale-125' : 'scale-100'
                )}
              >
                {b}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commentary */}
      {commentary && score.status === 'live' && (
        <div className={cn(
          'text-sm text-gray-300 bg-gray-900/50 rounded-xl p-3 border border-gray-800 transition-all',
          flashBall ? 'border-orange-500/30' : ''
        )}>
          💬 {commentary}
        </div>
      )}
    </div>
  )
}
