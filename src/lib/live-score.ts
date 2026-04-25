/**
 * Live score engine — fetches from CricAPI, falls back to simulator.
 * Called by the Vercel cron job every 60 seconds for live matches.
 */

const API_KEY = process.env.CRICKET_API_KEY || ''
const API_BASE = process.env.CRICKET_API_BASE || 'https://api.cricapi.com/v1'

export interface BallEvent {
  runs: number
  isWicket: boolean
  isWide: boolean
  isNoBall: boolean
  isFour: boolean
  isSix: boolean
  commentary: string
}

export interface LiveScore {
  matchId: string       // our DB match id
  externalId: string    // CricAPI match id
  status: 'live' | 'completed' | 'upcoming'
  team1Runs: number
  team1Wickets: number
  team1Overs: string
  team2Runs: number
  team2Wickets: number
  team2Overs: string
  currentInnings: number
  lastBall: string
  currentBatsmen: string
  currentBowler: string
  requiredRuns: number | null
  requiredOvers: string | null
  result: string | null
  winnerTeam: string | null
  team1Odds: number
  team2Odds: number
}

// ── CricAPI fetch ──────────────────────────────────────────────────────────

export async function fetchCricAPICurrentMatches(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/currentMatches?apikey=${API_KEY}&offset=0`, {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`CricAPI error ${res.status}`)
  const json = await res.json()
  if (json.status !== 'success') throw new Error(json.info || 'API failed')
  return json.data || []
}

export async function fetchCricAPIScorecard(externalId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/match_scorecard?apikey=${API_KEY}&id=${externalId}`, {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`CricAPI scorecard error ${res.status}`)
  const json = await res.json()
  if (json.status !== 'success') throw new Error(json.info || 'Scorecard failed')
  return json.data
}

// ── Parse CricAPI response into our LiveScore shape ────────────────────────

export function parseCricAPIMatch(raw: any, dbMatchId: string): Partial<LiveScore> {
  const scores: any[] = raw.score || []
  const inning1 = scores[0] || {}
  const inning2 = scores[1] || {}

  const status = raw.matchEnded ? 'completed'
    : raw.matchStarted ? 'live'
    : 'upcoming'

  const team1Runs = inning1.r ?? 0
  const team1Wickets = inning1.w ?? 0
  const team1Overs = inning1.o ? String(inning1.o) : '0.0'
  const team2Runs = inning2.r ?? 0
  const team2Wickets = inning2.w ?? 0
  const team2Overs = inning2.o ? String(inning2.o) : '0.0'
  const currentInnings = inning2.r !== undefined ? 2 : 1

  // Target / required run-rate
  let requiredRuns: number | null = null
  let requiredOvers: string | null = null
  if (currentInnings === 2 && team1Runs > 0) {
    requiredRuns = team1Runs + 1 - team2Runs
    const oversLeft = 20 - parseFloat(team2Overs)
    requiredOvers = oversLeft.toFixed(1)
  }

  // Dynamic odds based on run-rate differential
  const { team1Odds, team2Odds } = computeOdds(
    team1Runs, team1Wickets, team2Runs, team2Wickets, currentInnings
  )

  return {
    matchId: dbMatchId,
    externalId: raw.id,
    status,
    team1Runs,
    team1Wickets,
    team1Overs,
    team2Runs,
    team2Wickets,
    team2Overs,
    currentInnings,
    lastBall: raw.toss || '',
    currentBatsmen: '',
    currentBowler: '',
    requiredRuns,
    requiredOvers,
    result: raw.status || null,
    winnerTeam: extractWinner(raw.status),
    team1Odds,
    team2Odds,
  }
}

// ── Odds engine — updates on every ball ────────────────────────────────────

export function computeOdds(
  t1Runs: number, t1Wkts: number,
  t2Runs: number, t2Wkts: number,
  innings: number
): { team1Odds: number; team2Odds: number } {
  let t1Win = 0.5 // base 50/50

  if (innings === 1) {
    // First innings: favour higher scorer, penalise wickets
    const projected = t1Runs > 0 ? (t1Runs / Math.max(parseFloat('10'), 1)) * 20 : 160
    t1Win = projected > 175 ? 0.62 : projected > 150 ? 0.55 : 0.48
    t1Win -= t1Wkts * 0.025
  } else {
    // Second innings: favour chasing team if ahead of RRR
    if (t1Runs > 0) {
      const target = t1Runs + 1
      const remaining = target - t2Runs
      const ballsLeft = Math.max(1, (20 - parseFloat('10')) * 6)
      const rrr = (remaining / ballsLeft) * 6
      if (rrr < 6) t1Win = 0.35
      else if (rrr < 8) t1Win = 0.50
      else if (rrr < 10) t1Win = 0.62
      else t1Win = 0.72
      t1Win += t2Wkts * 0.03
    }
  }

  t1Win = Math.min(0.88, Math.max(0.12, t1Win))
  const t2Win = 1 - t1Win

  // Convert probability → decimal odds (with 5% margin)
  const margin = 0.95
  const t1Odds = Math.round((margin / t1Win) * 100) / 100
  const t2Odds = Math.round((margin / t2Win) * 100) / 100

  return { team1Odds: t1Odds, team2Odds: t2Odds }
}

function extractWinner(status: string | null): string | null {
  if (!status) return null
  const match = status.match(/^([A-Z]+)\s+won/i)
  return match ? match[1] : null
}

// ── Ball-by-ball simulator (dev / fallback) ─────────────────────────────────

const BALL_OUTCOMES = [
  { runs: 0, weight: 30, label: '●' },
  { runs: 1, weight: 25, label: '1' },
  { runs: 2, weight: 12, label: '2' },
  { runs: 3, weight: 4, label: '3' },
  { runs: 4, weight: 10, label: '4', isFour: true },
  { runs: 6, weight: 6, label: '6', isSix: true },
  { runs: 0, weight: 5, label: 'W', isWicket: true },
  { runs: 0, weight: 5, label: 'Wd', isWide: true },
  { runs: 0, weight: 3, label: 'Nb', isNoBall: true },
]

export function simulateBall(
  currentRuns: number,
  currentWickets: number,
  targetRuns?: number
): BallEvent {
  const weights = BALL_OUTCOMES.map(o => {
    let w = o.weight
    // Pressure situations: reduce big hits when wickets fall or chasing high RRR
    if (currentWickets >= 5) {
      if ((o as any).isSix) w = 3
      if ((o as any).isFour) w = 6
    }
    if (targetRuns) {
      const needed = targetRuns - currentRuns
      if (needed < 20) {
        if ((o as any).isSix) w *= 2
        if ((o as any).isFour) w *= 1.5
      }
    }
    return w
  })

  const total = weights.reduce((a, b) => a + b, 0)
  let rand = Math.random() * total
  let outcome = BALL_OUTCOMES[0]
  for (let i = 0; i < BALL_OUTCOMES.length; i++) {
    rand -= weights[i]
    if (rand <= 0) { outcome = BALL_OUTCOMES[i]; break }
  }

  const commentaries: Record<string, string[]> = {
    '●': ['Dot ball. Tight line.', 'Defended back.', 'Good length, played out.'],
    '1': ['Pushed to mid-on, quick single.', 'Rotates strike.', 'Tapped to leg, easy single.'],
    '2': ['Driven to long-off, two runs!', 'Placed through covers for 2.'],
    '4': ['FOUR! Cracking drive through covers!', 'FOUR! Pulled to fine leg!', 'FOUR! Edge races to boundary!'],
    '6': ['SIX! Massive hit over long-on!', 'SIX! Cleared the ropes easily!', 'SIX! What a shot!'],
    'W': ['WICKET! Clean bowled!', 'WICKET! Caught at slip!', 'WICKET! LBW! Out!', 'WICKET! Caught behind!'],
    'Wd': ['Wide down the leg side.', 'Too wide outside off, called wide.'],
    'Nb': ['No-ball! Free hit coming.', 'Overstepped — no-ball.'],
  }

  const pool = commentaries[outcome.label] || ['Ball played.']
  const commentary = pool[Math.floor(Math.random() * pool.length)]

  return {
    runs: outcome.runs,
    isWicket: !!(outcome as any).isWicket,
    isWide: !!(outcome as any).isWide,
    isNoBall: !!(outcome as any).isNoBall,
    isFour: !!(outcome as any).isFour,
    isSix: !!(outcome as any).isSix,
    commentary,
  }
}

export function formatOvers(balls: number): string {
  const completedOvers = Math.floor(balls / 6)
  const remainingBalls = balls % 6
  return `${completedOvers}.${remainingBalls}`
}

export function parseOversToInt(overs: string): number {
  const [o, b] = overs.split('.').map(Number)
  return (o || 0) * 6 + (b || 0)
}
