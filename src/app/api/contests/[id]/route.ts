import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contest = await prisma.contest.findUnique({
      where: { id: params.id },
      include: {
        match: true,
        entries: {
          include: {
            user: { select: { id: true, name: true, avatar: true } }
          },
          orderBy: { score: 'desc' },
          take: 50,
        }
      }
    })

    if (!contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 })
    }

    return NextResponse.json({ contest })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contest' }, { status: 500 })
  }
}
