import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'all' // all | weekly | monthly
    const limit = parseInt(searchParams.get('limit') || '50')

    const users = await prisma.user.findMany({
      where: { role: 'user', isActive: true },
      select: {
        id: true, name: true, avatar: true,
        totalWon: true, totalLost: true,
        _count: { select: { trades: true, bets: true } }
      },
      orderBy: { totalWon: 'desc' },
      take: limit,
    })

    const leaderboard = users.map((u, index) => ({
      rank: index + 1,
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      totalWon: u.totalWon,
      totalLost: u.totalLost,
      netPnl: u.totalWon - u.totalLost,
      trades: u._count.trades,
      bets: u._count.bets,
    }))

    return NextResponse.json({ leaderboard })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
