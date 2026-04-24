import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const team = searchParams.get('team')
    const role = searchParams.get('role')

    const where: any = { isActive: true }
    if (team) where.team = team
    if (role) where.role = role

    const players = await prisma.player.findMany({
      where,
      orderBy: [{ team: 'asc' }, { creditValue: 'desc' }],
    })

    return NextResponse.json({ players })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 })
  }
}
