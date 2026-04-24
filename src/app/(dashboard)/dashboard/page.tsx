import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import TopBar from '@/components/layout/TopBar'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const [user, liveMatches, upcomingMatches, recentBets, recentTrades, notifications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, name: true, balance: true, bonusBalance: true,
        totalWon: true, totalLost: true, totalDeposited: true,
        _count: { select: { trades: true, bets: true, contestEntries: true } }
      }
    }),
    prisma.match.findMany({
      where: { status: 'live' },
      orderBy: { startTime: 'asc' },
      take: 3,
    }),
    prisma.match.findMany({
      where: { status: 'upcoming' },
      orderBy: { startTime: 'asc' },
      take: 5,
    }),
    prisma.bet.findMany({
      where: { userId: session.user.id },
      include: { match: { select: { team1Short: true, team2Short: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.trade.findMany({
      where: { userId: session.user.id },
      include: { match: { select: { team1Short: true, team2Short: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.notification.findMany({
      where: { userId: session.user.id, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
  ])

  return (
    <>
      <TopBar title="Dashboard" />
      <DashboardClient
        user={user}
        liveMatches={liveMatches}
        upcomingMatches={upcomingMatches}
        recentBets={recentBets}
        recentTrades={recentTrades}
        notifications={notifications}
        userName={session.user.name}
      />
    </>
  )
}
