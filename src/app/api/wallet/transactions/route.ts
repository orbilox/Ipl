import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const type = searchParams.get('type')
    const limit = 20

    const where: any = { userId: session.user.id }
    if (type) where.type = type

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where })
    ])

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true, totalDeposited: true, totalWithdrawn: true, totalWon: true }
    })

    return NextResponse.json({
      transactions,
      total,
      pages: Math.ceil(total / limit),
      summary: user,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
