/**
 * Admin-only: manually trigger ball simulation or start/stop a live match simulation.
 * POST /api/simulate  { matchId, action: 'start' | 'ball' | 'stop' | 'set_live' }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { simulateBall, computeOdds, formatOvers, parseOversToInt } from '@/lib/live-score'

function isAdmin(role: string) {
  return role === 'admin' || role === 'superadmin'
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { matchId, action, balls = 1 } = await req.json()
  if (!matchId) return NextResponse.json({ error: 'matchId required' }, { status: 400 })

  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  switch (action) {
    case 'set_live': {
      await prisma.match.update({
        where: { id: matchId },
        data: {
          status: 'live',
          currentInnings: 1,
          team1Runs: 0, team1Wickets: 0, team1Overs: '0.0',
          team2Runs: 0, team2Wickets: 0, team2Overs: '0.0',
          team1Score: '0/0', team2Score: null,
        },
      })
      return NextResponse.json({ message: `${match.team1Short} vs ${match.team2Short} set to LIVE` })
    }

    case 'ball': {
      // Simulate N balls and return updated state
      let current = match
      const events: string[] = []

      for (let i = 0; i < Math.min(balls, 30); i++) {
        const innings = current.currentInnings || 1
        const battingRuns = innings === 1 ? (current.team1Runs || 0) : (current.team2Runs || 0)
        const battingWkts = innings === 1 ? (current.team1Wickets || 0) : (current.team2Wickets || 0)
        const battingOvers = innings === 1 ? (current.team1Overs || '0.0') : (current.team2Overs || '0.0')
        const target = innings === 2 ? (current.team1Runs || 0) + 1 : undefined
        const currentBalls = parseOversToInt(battingOvers)

        // Switch innings
        if (currentBalls >= 120 || battingWkts >= 10) {
          if (innings === 1) {
            current = await prisma.match.update({
              where: { id: matchId },
              data: { currentInnings: 2, team2Runs: 0, team2Wickets: 0, team2Overs: '0.0' },
            })
            events.push('--- Innings break ---')
            continue
          } else break
        }

        const ball = simulateBall(battingRuns, battingWkts, target)
        const newRuns = battingRuns + (ball.isWide || ball.isNoBall ? ball.runs + 1 : ball.runs)
        const newWkts = battingWkts + (ball.isWicket ? 1 : 0)
        const newBalls = ball.isWide || ball.isNoBall ? currentBalls : currentBalls + 1
        const newOvers = formatOvers(newBalls)

        const { team1Odds, team2Odds } = innings === 1
          ? computeOdds(newRuns, newWkts, current.team2Runs || 0, current.team2Wickets || 0, 1)
          : computeOdds(current.team1Runs || 0, current.team1Wickets || 0, newRuns, newWkts, 2)

        // Win check
        if (innings === 2 && target && newRuns >= target) {
          current = await prisma.match.update({
            where: { id: matchId },
            data: {
              team2Runs: newRuns, team2Wickets: newWkts, team2Overs: newOvers,
              team2Score: `${newRuns}/${newWkts}`,
              status: 'completed',
              winnerTeam: current.team2Short,
              result: `${current.team2} won by ${10 - newWkts} wickets`,
              team1Odds, team2Odds,
              lastBall: ball.commentary,
            },
          })
          events.push(`🏆 ${current.team2} WON!`)
          break
        }

        const updateData = innings === 1 ? {
          team1Runs: newRuns, team1Wickets: newWkts, team1Overs: newOvers,
          team1Score: `${newRuns}/${newWkts}`,
          lastBall: ball.commentary, team1Odds, team2Odds,
        } : {
          team2Runs: newRuns, team2Wickets: newWkts, team2Overs: newOvers,
          team2Score: `${newRuns}/${newWkts}`,
          requiredRuns: (current.team1Runs || 0) + 1 - newRuns,
          requiredOvers: (20 - parseFloat(newOvers)).toFixed(1),
          lastBall: ball.commentary, team1Odds, team2Odds,
        }

        current = await prisma.match.update({ where: { id: matchId }, data: updateData })
        events.push(`${newOvers} | ${ball.commentary}`)
      }

      return NextResponse.json({ match: current, events })
    }

    case 'stop': {
      await prisma.match.update({
        where: { id: matchId },
        data: { status: 'upcoming' },
      })
      return NextResponse.json({ message: 'Simulation stopped' })
    }

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}
