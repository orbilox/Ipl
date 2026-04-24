import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

function isAdmin(role: string) {
  return role === 'admin' || role === 'superadmin'
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const matches = await prisma.match.findMany({
    orderBy: { startTime: 'desc' },
    include: {
      _count: { select: { trades: true, bets: true, contests: true } }
    }
  })

  return NextResponse.json({ matches })
}

const createMatchSchema = z.object({
  team1: z.string(),
  team2: z.string(),
  team1Short: z.string(),
  team2Short: z.string(),
  venue: z.string(),
  city: z.string(),
  startTime: z.string(),
  matchNumber: z.number().optional(),
  team1Odds: z.number(),
  team2Odds: z.number(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = createMatchSchema.parse(body)

    const match = await prisma.match.create({
      data: { ...data, startTime: new Date(data.startTime) }
    })

    return NextResponse.json({ match }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 })
  }
}

const updateMatchSchema = z.object({
  matchId: z.string(),
  status: z.enum(['upcoming', 'live', 'completed', 'cancelled']).optional(),
  isLocked: z.boolean().optional(),
  team1Runs: z.number().optional(),
  team1Wickets: z.number().optional(),
  team1Overs: z.string().optional(),
  team2Runs: z.number().optional(),
  team2Wickets: z.number().optional(),
  team2Overs: z.string().optional(),
  result: z.string().optional(),
  winnerTeam: z.string().optional(),
  team1Odds: z.number().optional(),
  team2Odds: z.number().optional(),
  currentBatsmen: z.string().optional(),
  currentBowler: z.string().optional(),
  lastBall: z.string().optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { matchId, ...updateData } = updateMatchSchema.parse(body)

    // Auto-generate score strings
    const updates: any = { ...updateData }
    if (updateData.team1Runs !== undefined && updateData.team1Wickets !== undefined) {
      updates.team1Score = `${updateData.team1Runs}/${updateData.team1Wickets}`
    }
    if (updateData.team2Runs !== undefined && updateData.team2Wickets !== undefined) {
      updates.team2Score = `${updateData.team2Runs}/${updateData.team2Wickets}`
    }

    // If marking completed, settle bets/trades
    if (updateData.status === 'completed' && updateData.winnerTeam) {
      await settleMatchBets(matchId, updateData.winnerTeam)
    }

    const match = await prisma.match.update({
      where: { id: matchId },
      data: updates,
    })

    return NextResponse.json({ match })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 })
  }
}

async function settleMatchBets(matchId: string, winnerTeam: string) {
  // Settle match winner bets
  const bets = await prisma.bet.findMany({
    where: { matchId, status: 'active', betCategory: 'match_winner' },
    include: { user: true }
  })

  for (const bet of bets) {
    const won = bet.betValue === winnerTeam
    const newStatus = won ? 'won' : 'lost'
    const pnl = won ? bet.potentialWin - bet.amount : -bet.amount

    await prisma.$transaction([
      prisma.bet.update({
        where: { id: bet.id },
        data: { status: newStatus, pnl, settledAt: new Date(), result: winnerTeam }
      }),
      ...(won ? [
        prisma.user.update({
          where: { id: bet.userId },
          data: { balance: { increment: bet.potentialWin }, totalWon: { increment: bet.potentialWin } }
        }),
        prisma.transaction.create({
          data: {
            userId: bet.userId,
            type: 'bet_win',
            amount: bet.potentialWin,
            balance: bet.user.balance + bet.potentialWin,
            description: `Bet won: ${bet.betCategory} - ${bet.betValue}`,
            referenceId: matchId,
            status: 'completed',
          }
        })
      ] : [
        prisma.user.update({
          where: { id: bet.userId },
          data: { totalLost: { increment: bet.amount } }
        })
      ])
    ])
  }

  // Settle match winner trades
  const trades = await prisma.trade.findMany({
    where: { matchId, status: 'active' },
    include: { user: true }
  })

  for (const trade of trades) {
    const match = await prisma.match.findUnique({ where: { id: matchId } })
    if (!match) continue

    const won = (trade.prediction === 'team1_win' && winnerTeam === match.team1Short) ||
                (trade.prediction === 'team2_win' && winnerTeam === match.team2Short)
    const pnl = won ? trade.potentialWin - trade.amount : -trade.amount

    await prisma.$transaction([
      prisma.trade.update({
        where: { id: trade.id },
        data: { status: won ? 'won' : 'lost', pnl, settledAt: new Date() }
      }),
      ...(won ? [
        prisma.user.update({
          where: { id: trade.userId },
          data: { balance: { increment: trade.potentialWin }, totalWon: { increment: trade.potentialWin } }
        }),
        prisma.transaction.create({
          data: {
            userId: trade.userId,
            type: 'trade_win',
            amount: trade.potentialWin,
            balance: trade.user.balance + trade.potentialWin,
            description: `Trade won: ${trade.prediction} (${trade.tradeType})`,
            referenceId: matchId,
            status: 'completed',
          }
        })
      ] : [
        prisma.user.update({
          where: { id: trade.userId },
          data: { totalLost: { increment: trade.amount } }
        })
      ])
    ])
  }
}
