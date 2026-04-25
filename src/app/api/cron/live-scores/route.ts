/**
 * Vercel Cron Job — runs every 60 seconds.
 * Fetches live scores from CricAPI and updates all live matches in the DB.
 * Falls back to the simulator if API is unavailable or quota exceeded.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  fetchCricAPICurrentMatches,
  parseCricAPIMatch,
  simulateBall,
  computeOdds,
  formatOvers,
  parseOversToInt,
} from '@/lib/live-score'

// Vercel cron secret to prevent unauthorized calls
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

  const liveMatches = await prisma.match.findMany({
    where: { status: 'live' },
  })

  if (liveMatches.length === 0) {
    // Also check if any upcoming matches should go live now
    const now = new Date()
    const startingSoon = await prisma.match.findMany({
      where: {
        status: 'upcoming',
        startTime: { lte: new Date(now.getTime() + 5 * 60 * 1000) },
      },
    })
    for (const m of startingSoon) {
      if (new Date(m.startTime) <= now) {
        await prisma.match.update({
          where: { id: m.id },
          data: { status: 'live', currentInnings: 1 },
        })
      }
    }
    return NextResponse.json({ updated: 0, message: 'No live matches' })
  }

  const results: string[] = []

  // Try real API first
  let apiMatches: any[] = []
  let apiAvailable = false
  try {
    if (process.env.CRICKET_API_KEY && process.env.CRICKET_API_KEY !== 'demo-key') {
      apiMatches = await fetchCricAPICurrentMatches()
      apiAvailable = true
    }
  } catch {
    apiAvailable = false
  }

  for (const match of liveMatches) {
    try {
      // Find matching API entry by externalId or team names
      const apiEntry = apiMatches.find(
        (m: any) =>
          m.id === match.externalId ||
          (m.teams?.includes(match.team1) && m.teams?.includes(match.team2))
      )

      if (apiAvailable && apiEntry) {
        // ── Real API data ──────────────────────────────────────────────
        const parsed = parseCricAPIMatch(apiEntry, match.id)
        await prisma.match.update({
          where: { id: match.id },
          data: {
            team1Runs: parsed.team1Runs,
            team1Wickets: parsed.team1Wickets,
            team1Overs: parsed.team1Overs,
            team1Score: `${parsed.team1Runs}/${parsed.team1Wickets}`,
            team2Runs: parsed.team2Runs,
            team2Wickets: parsed.team2Wickets,
            team2Overs: parsed.team2Overs,
            team2Score: parsed.team2Runs
              ? `${parsed.team2Runs}/${parsed.team2Wickets}`
              : undefined,
            currentInnings: parsed.currentInnings,
            requiredRuns: parsed.requiredRuns,
            requiredOvers: parsed.requiredOvers,
            lastBall: parsed.lastBall,
            team1Odds: parsed.team1Odds,
            team2Odds: parsed.team2Odds,
            ...(parsed.status === 'completed'
              ? { status: 'completed', result: parsed.result, winnerTeam: parsed.winnerTeam }
              : {}),
          },
        })
        results.push(`${match.team1Short}v${match.team2Short}: API ✓`)
      } else {
        // ── Simulator fallback ─────────────────────────────────────────
        await simulateOneBall(match)
        results.push(`${match.team1Short}v${match.team2Short}: Simulated`)
      }
    } catch (err) {
      results.push(`${match.team1Short}v${match.team2Short}: Error`)
    }
  }

  return NextResponse.json({ updated: liveMatches.length, results, apiAvailable })
}

async function simulateOneBall(match: any) {
  const innings = match.currentInnings || 1

  // Determine batting team's current state
  const battingRuns = innings === 1 ? (match.team1Runs || 0) : (match.team2Runs || 0)
  const battingWkts = innings === 1 ? (match.team1Wickets || 0) : (match.team2Wickets || 0)
  const battingOvers = innings === 1 ? (match.team1Overs || '0.0') : (match.team2Overs || '0.0')
  const targetRuns = innings === 2 ? (match.team1Runs || 0) + 1 : undefined

  const currentBalls = parseOversToInt(battingOvers)

  // Innings is over — 20 overs or 10 wickets
  if (currentBalls >= 120 || battingWkts >= 10) {
    if (innings === 1) {
      // Switch to second innings
      await prisma.match.update({
        where: { id: match.id },
        data: { currentInnings: 2, team2Runs: 0, team2Wickets: 0, team2Overs: '0.0' },
      })
      return
    } else {
      // Match over — determine result
      const t1 = match.team1Runs || 0
      const t2 = battingRuns
      const winner = t2 > t1 ? match.team2Short : match.team1Short
      const margin = t2 > t1 ? `${10 - battingWkts} wickets` : `${t1 - t2} runs`
      await prisma.match.update({
        where: { id: match.id },
        data: {
          status: 'completed',
          winnerTeam: winner,
          result: `${winner === match.team2Short ? match.team2 : match.team1} won by ${margin}`,
        },
      })
      // Settle all bets and trades
      await fetch(`${process.env.APP_URL}/api/admin/matches`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id, status: 'completed', winnerTeam: winner }),
      }).catch(() => {})
      return
    }
  }

  // Simulate one ball
  const ball = simulateBall(battingRuns, battingWkts, targetRuns)
  const newRuns = battingRuns + (ball.isWide || ball.isNoBall ? ball.runs + 1 : ball.runs)
  const newWkts = battingWkts + (ball.isWicket ? 1 : 0)
  const newBalls = ball.isWide || ball.isNoBall ? currentBalls : currentBalls + 1
  const newOvers = formatOvers(newBalls)

  // Recalculate odds dynamically
  const { team1Odds, team2Odds } = innings === 1
    ? computeOdds(newRuns, newWkts, match.team2Runs || 0, match.team2Wickets || 0, 1)
    : computeOdds(match.team1Runs || 0, match.team1Wickets || 0, newRuns, newWkts, 2)

  // Check win condition mid-innings (team2 reaches target)
  if (innings === 2 && targetRuns && newRuns >= targetRuns) {
    const wicketsLeft = 10 - newWkts
    await prisma.match.update({
      where: { id: match.id },
      data: {
        team2Runs: newRuns,
        team2Wickets: newWkts,
        team2Overs: newOvers,
        team2Score: `${newRuns}/${newWkts}`,
        lastBall: ball.label ?? ball.commentary.slice(0, 20),
        status: 'completed',
        winnerTeam: match.team2Short,
        result: `${match.team2} won by ${wicketsLeft} wickets`,
        team1Odds,
        team2Odds,
      },
    })
    return
  }

  if (innings === 1) {
    const requiredRuns = innings === 1 ? null : (match.team1Runs || 0) + 1 - newRuns
    await prisma.match.update({
      where: { id: match.id },
      data: {
        team1Runs: newRuns,
        team1Wickets: newWkts,
        team1Overs: newOvers,
        team1Score: `${newRuns}/${newWkts}`,
        lastBall: ball.commentary.slice(0, 60),
        team1Odds,
        team2Odds,
      },
    })
  } else {
    const req = (match.team1Runs || 0) + 1 - newRuns
    const ovsLeft = (20 - parseFloat(newOvers)).toFixed(1)
    await prisma.match.update({
      where: { id: match.id },
      data: {
        team2Runs: newRuns,
        team2Wickets: newWkts,
        team2Overs: newOvers,
        team2Score: `${newRuns}/${newWkts}`,
        requiredRuns: req > 0 ? req : 0,
        requiredOvers: ovsLeft,
        lastBall: ball.commentary.slice(0, 60),
        team1Odds,
        team2Odds,
      },
    })
  }
}
