/**
 * Vercel Cron Job — runs every 60 seconds.
 * Priority: Cricbuzz (free, no key) → CricAPI (paid key) → Simulator fallback
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  fetchCricbuzzLiveMatches,
  parseCricbuzzMatch,
  fetchCricAPICurrentMatches,
  parseCricAPIMatch,
  simulateBall,
  computeOdds,
  formatOvers,
  parseOversToInt,
} from '@/lib/live-score'

function isAuthorized(req: NextRequest) {
  const secret = req.headers.get('authorization')
  return (
    secret === `Bearer ${process.env.CRON_SECRET}` ||
    process.env.NODE_ENV === 'development'
  )
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const liveMatches = await prisma.match.findMany({ where: { status: 'live' } })

  if (liveMatches.length === 0) {
    // Auto-start matches whose startTime has passed
    const now = new Date()
    const due = await prisma.match.findMany({
      where: { status: 'upcoming', startTime: { lte: now } },
    })
    for (const m of due) {
      await prisma.match.update({
        where: { id: m.id },
        data: { status: 'live', currentInnings: 1 },
      })
    }
    return NextResponse.json({ updated: 0, message: 'No live matches' })
  }

  const results: string[] = []

  // ── 1. Try Cricbuzz (free, no key) ─────────────────────────────────────────
  let cbMatches: any[] = []
  let cbAvailable = false
  try {
    cbMatches = await fetchCricbuzzLiveMatches()
    cbAvailable = cbMatches.length > 0
  } catch {
    cbAvailable = false
  }

  // ── 2. Try CricAPI (needs CRICKET_API_KEY env var) ─────────────────────────
  let apiMatches: any[] = []
  let apiAvailable = false
  try {
    if (process.env.CRICKET_API_KEY && process.env.CRICKET_API_KEY !== 'demo-key') {
      apiMatches = await fetchCricAPICurrentMatches()
      apiAvailable = apiMatches.length > 0
    }
  } catch {
    apiAvailable = false
  }

  for (const match of liveMatches) {
    try {
      // ── Match against Cricbuzz by team short names ──────────────────────
      const cbEntry = cbMatches.find((m: any) => {
        const t1 = m.matchInfo?.team1?.teamSName || ''
        const t2 = m.matchInfo?.team2?.teamSName || ''
        return (
          (t1 === match.team1Short && t2 === match.team2Short) ||
          (t1 === match.team2Short && t2 === match.team1Short)
        )
      })

      if (cbAvailable && cbEntry) {
        const parsed = parseCricbuzzMatch(cbEntry, match.id, match.team1Short, match.team2Short)
        await applyParsedScore(match, parsed)
        results.push(`${match.team1Short}v${match.team2Short}: Cricbuzz ✓`)
        continue
      }

      // ── Match against CricAPI by externalId or team name ───────────────
      const apiEntry = apiMatches.find(
        (m: any) =>
          m.id === match.externalId ||
          (m.teams?.includes(match.team1) && m.teams?.includes(match.team2))
      )

      if (apiAvailable && apiEntry) {
        const parsed = parseCricAPIMatch(apiEntry, match.id)
        await applyParsedScore(match, parsed)
        results.push(`${match.team1Short}v${match.team2Short}: CricAPI ✓`)
        continue
      }

      // ── Simulator fallback ─────────────────────────────────────────────
      await simulateOneBall(match)
      results.push(`${match.team1Short}v${match.team2Short}: Simulated`)
    } catch {
      results.push(`${match.team1Short}v${match.team2Short}: Error`)
    }
  }

  return NextResponse.json({
    updated: liveMatches.length,
    results,
    sources: { cricbuzz: cbAvailable, cricapi: apiAvailable },
  })
}

async function applyParsedScore(match: any, parsed: any) {
  const updateData: any = {
    team1Runs: parsed.team1Runs,
    team1Wickets: parsed.team1Wickets,
    team1Overs: parsed.team1Overs,
    team1Score: `${parsed.team1Runs}/${parsed.team1Wickets}`,
    team2Runs: parsed.team2Runs ?? null,
    team2Wickets: parsed.team2Wickets ?? null,
    team2Overs: parsed.team2Overs ?? null,
    team2Score: parsed.team2Runs != null
      ? `${parsed.team2Runs}/${parsed.team2Wickets}`
      : null,
    currentInnings: parsed.currentInnings,
    requiredRuns: parsed.requiredRuns ?? null,
    requiredOvers: parsed.requiredOvers ?? null,
    lastBall: parsed.lastBall || null,
    team1Odds: parsed.team1Odds,
    team2Odds: parsed.team2Odds,
  }

  if (parsed.status === 'completed') {
    updateData.status = 'completed'
    updateData.result = parsed.result
    updateData.winnerTeam = parsed.winnerTeam
    // Settle bets and trades
    await fetch(`${process.env.APP_URL}/api/admin/matches`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId: match.id,
        status: 'completed',
        winnerTeam: parsed.winnerTeam,
      }),
    }).catch(() => {})
  }

  await prisma.match.update({ where: { id: match.id }, data: updateData })
}

async function simulateOneBall(match: any) {
  const innings = match.currentInnings || 1
  const battingRuns = innings === 1 ? (match.team1Runs || 0) : (match.team2Runs || 0)
  const battingWkts = innings === 1 ? (match.team1Wickets || 0) : (match.team2Wickets || 0)
  const battingOvers = innings === 1 ? (match.team1Overs || '0.0') : (match.team2Overs || '0.0')
  const targetRuns = innings === 2 ? (match.team1Runs || 0) + 1 : undefined
  const currentBalls = parseOversToInt(battingOvers)

  if (currentBalls >= 120 || battingWkts >= 10) {
    if (innings === 1) {
      await prisma.match.update({
        where: { id: match.id },
        data: { currentInnings: 2, team2Runs: 0, team2Wickets: 0, team2Overs: '0.0' },
      })
    } else {
      const t1 = match.team1Runs || 0
      const winner = battingRuns > t1 ? match.team2Short : match.team1Short
      const margin = battingRuns > t1
        ? `${10 - battingWkts} wickets`
        : `${t1 - battingRuns} runs`
      await prisma.match.update({
        where: { id: match.id },
        data: {
          status: 'completed',
          winnerTeam: winner,
          result: `${winner === match.team2Short ? match.team2 : match.team1} won by ${margin}`,
        },
      })
      await fetch(`${process.env.APP_URL}/api/admin/matches`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id, status: 'completed', winnerTeam: winner }),
      }).catch(() => {})
    }
    return
  }

  const ball = simulateBall(battingRuns, battingWkts, targetRuns)
  const newRuns = battingRuns + (ball.isWide || ball.isNoBall ? ball.runs + 1 : ball.runs)
  const newWkts = battingWkts + (ball.isWicket ? 1 : 0)
  const newBalls = ball.isWide || ball.isNoBall ? currentBalls : currentBalls + 1
  const newOvers = formatOvers(newBalls)

  const { team1Odds, team2Odds } = innings === 1
    ? computeOdds(newRuns, newWkts, match.team2Runs || 0, match.team2Wickets || 0, 1)
    : computeOdds(match.team1Runs || 0, match.team1Wickets || 0, newRuns, newWkts, 2)

  if (innings === 2 && targetRuns && newRuns >= targetRuns) {
    await prisma.match.update({
      where: { id: match.id },
      data: {
        team2Runs: newRuns, team2Wickets: newWkts, team2Overs: newOvers,
        team2Score: `${newRuns}/${newWkts}`,
        lastBall: ball.commentary.slice(0, 60),
        status: 'completed',
        winnerTeam: match.team2Short,
        result: `${match.team2} won by ${10 - newWkts} wickets`,
        team1Odds, team2Odds,
      },
    })
    return
  }

  if (innings === 1) {
    await prisma.match.update({
      where: { id: match.id },
      data: {
        team1Runs: newRuns, team1Wickets: newWkts, team1Overs: newOvers,
        team1Score: `${newRuns}/${newWkts}`,
        lastBall: ball.commentary.slice(0, 60),
        team1Odds, team2Odds,
      },
    })
  } else {
    await prisma.match.update({
      where: { id: match.id },
      data: {
        team2Runs: newRuns, team2Wickets: newWkts, team2Overs: newOvers,
        team2Score: `${newRuns}/${newWkts}`,
        requiredRuns: Math.max(0, (match.team1Runs || 0) + 1 - newRuns),
        requiredOvers: Math.max(0, 20 - parseFloat(newOvers)).toFixed(1),
        lastBall: ball.commentary.slice(0, 60),
        team1Odds, team2Odds,
      },
    })
  }
}
