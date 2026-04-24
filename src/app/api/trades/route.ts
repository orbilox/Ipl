import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createTradeSchema = z.object({
  matchId: z.string(),
  tradeType: z.string(),
  prediction: z.string(),
  amount: z.number().min(10).max(100000),
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

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where,
        include: { match: { select: { team1: true, team2: true, team1Short: true, team2Short: true, status: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.trade.count({ where })
    ])

    return NextResponse.json({ trades, total, pages: Math.ceil(total / limit) })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { matchId, tradeType, prediction, amount, odds } = createTradeSchema.parse(body)

    // Check user balance
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Check match is tradeable
    const match = await prisma.match.findUnique({ where: { id: matchId } })
    if (!match || match.isLocked || match.status === 'completed' || match.status === 'cancelled') {
      return NextResponse.json({ error: 'Match is not available for trading' }, { status: 400 })
    }

    const potentialWin = Math.round(amount * odds * 100) / 100

    const [trade] = await prisma.$transaction([
      prisma.trade.create({
        data: {
          userId: session.user.id,
          matchId,
          tradeType,
          prediction,
          amount,
          odds,
          potentialWin,
          status: match.status === 'live' ? 'active' : 'active',
        }
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { balance: { decrement: amount } }
      }),
      prisma.transaction.create({
        data: {
          userId: session.user.id,
          type: 'trade_entry',
          amount: -amount,
          balance: user.balance - amount,
          description: `Trade placed on ${match.team1Short} vs ${match.team2Short}`,
          referenceId: matchId,
          status: 'completed',
        }
      })
    ])

    return NextResponse.json({ trade, message: 'Trade placed successfully' }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to place trade' }, { status: 500 })
  }
}
