import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}
    if (status) where.status = status

    const matches = await prisma.match.findMany({
      where,
      orderBy: [
        { featuredMatch: 'desc' },
        { startTime: 'asc' }
      ],
      take: limit,
      include: {
        _count: {
          select: { trades: true, bets: true, contests: true }
        }
      }
    })

    return NextResponse.json({ matches })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
}
