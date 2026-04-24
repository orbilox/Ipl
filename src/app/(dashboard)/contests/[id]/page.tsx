import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import ContestDetailClient from './ContestDetailClient'

export default async function ContestDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  const [contest, players] = await Promise.all([
    prisma.contest.findUnique({
      where: { id: params.id },
      include: {
        match: true,
        entries: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { score: 'desc' },
          take: 20,
        }
      }
    }),
    prisma.player.findMany({ where: { isActive: true }, orderBy: { creditValue: 'desc' } })
  ])

  if (!contest) notFound()

  const userEntry = session ? contest.entries.find(e => e.userId === session.user.id) : null
  const prizeBreakdown = JSON.parse(contest.prizeBreakdown || '[]')

  return (
    <>
      <TopBar />
      <ContestDetailClient
        contest={contest as any}
        players={players}
        userEntry={userEntry as any}
        prizeBreakdown={prizeBreakdown}
        currentUserId={session?.user.id}
        userBalance={session?.user.balance || 0}
      />
    </>
  )
}
