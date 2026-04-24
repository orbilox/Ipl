import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: params.id },
      include: {
        contests: {
          where: { status: { in: ['open', 'live'] } },
          orderBy: { entryFee: 'desc' },
          take: 10,
        },
        playerStats: {
          include: { player: true }
        },
        _count: {
          select: { trades: true, bets: true }
        }
      }
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    return NextResponse.json({ match })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 })
  }
}
