import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const matchId = searchParams.get('matchId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: any = {}
    if (matchId) where.matchId = matchId
    if (status) where.status = status
    if (type) where.contestType = type

    const contests = await prisma.contest.findMany({
      where,
      include: {
        match: {
          select: {
            team1: true, team2: true, team1Short: true, team2Short: true,
            status: true, startTime: true
          }
        },
        _count: { select: { entries: true } }
      },
      orderBy: [{ isFeatured: 'desc' }, { totalPrizePool: 'desc' }],
    })

    return NextResponse.json({ contests })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contests' }, { status: 500 })
  }
}

const joinContestSchema = z.object({
  contestId: z.string(),
  teamName: z.string().min(3).max(30),
  players: z.array(z.string()).min(11).max(11),
  captain: z.string(),
  viceCaptain: z.string(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { contestId, teamName, players, captain, viceCaptain } = joinContestSchema.parse(body)

    const [contest, user] = await Promise.all([
      prisma.contest.findUnique({ where: { id: contestId } }),
      prisma.user.findUnique({ where: { id: session.user.id } })
    ])

    if (!contest) return NextResponse.json({ error: 'Contest not found' }, { status: 404 })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (contest.status !== 'open' && contest.status !== 'upcoming') {
      return NextResponse.json({ error: 'Contest is not open for entries' }, { status: 400 })
    }

    if (contest.currentParticipants >= contest.maxParticipants) {
      return NextResponse.json({ error: 'Contest is full' }, { status: 400 })
    }

    if (user.balance < contest.entryFee) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    const existing = await prisma.contestEntry.findUnique({
      where: { contestId_userId: { contestId, userId: session.user.id } }
    })
    if (existing) {
      return NextResponse.json({ error: 'Already joined this contest' }, { status: 400 })
    }

    const newBalance = user.balance - contest.entryFee

    const [entry] = await prisma.$transaction([
      prisma.contestEntry.create({
        data: {
          contestId,
          userId: session.user.id,
          teamName,
          players: JSON.stringify(players),
          captain,
          viceCaptain,
          status: 'active',
        }
      }),
      prisma.contest.update({
        where: { id: contestId },
        data: { currentParticipants: { increment: 1 } }
      }),
      ...(contest.entryFee > 0 ? [
        prisma.user.update({
          where: { id: session.user.id },
          data: { balance: { decrement: contest.entryFee } }
        }),
        prisma.transaction.create({
          data: {
            userId: session.user.id,
            type: 'contest_entry',
            amount: -contest.entryFee,
            balance: newBalance,
            description: `Contest entry: ${contest.name}`,
            referenceId: contestId,
            status: 'completed',
          }
        })
      ] : [])
    ])

    return NextResponse.json({ entry, message: 'Successfully joined contest' }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to join contest' }, { status: 500 })
  }
}
