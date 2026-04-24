import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createBetSchema = z.object({
  matchId: z.string(),
  betCategory: z.string(),
  betType: z.string(),
  betValue: z.string(),
  amount: z.number().min(10).max(50000),
  odds: z.number().min(1.01),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20

    const where: any = { userId: session.user.id }
    if (status) where.status = status

    const [bets, total] = await Promise.all([
      prisma.bet.findMany({
        where,
        include: { match: { select: { team1: true, team2: true, team1Short: true, team2Short: true, status: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bet.count({ where })
    ])

    return NextResponse.json({ bets, total, pages: Math.ceil(total / limit) })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bets' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { matchId, betCategory, betType, betValue, amount, odds } = createBetSchema.parse(body)

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } })
    if (!match || match.isLocked || match.status === 'completed' || match.status === 'cancelled') {
      return NextResponse.json({ error: 'Match not available for betting' }, { status: 400 })
    }

    const potentialWin = Math.round(amount * odds * 100) / 100

    const [bet] = await prisma.$transaction([
      prisma.bet.create({
        data: {
          userId: session.user.id,
          matchId,
          betCategory,
          betType,
          betValue,
          amount,
          odds,
          potentialWin,
          status: 'active',
        }
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { balance: { decrement: amount } }
      }),
      prisma.transaction.create({
        data: {
          userId: session.user.id,
          type: 'bet_entry',
          amount: -amount,
          balance: user.balance - amount,
          description: `Bet on ${betCategory} - ${betValue} (${match.team1Short} vs ${match.team2Short})`,
          referenceId: matchId,
          status: 'completed',
        }
      })
    ])

    return NextResponse.json({ bet, message: 'Bet placed successfully' }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to place bet' }, { status: 500 })
  }
}
