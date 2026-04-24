import { prisma } from '@/lib/db'
import { formatCurrency, formatDateTime } from '@/lib/utils'

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ')
}
import { Trophy, Users } from 'lucide-react'

export const revalidate = 30

export default async function AdminContestsPage() {
  const contests = await prisma.contest.findMany({
    include: {
      match: { select: { team1Short: true, team2Short: true, status: true } },
      _count: { select: { entries: true } }
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-white">Contests</h1>
        <div className="text-gray-400 text-sm">{contests.length} total</div>
      </div>

      <div className="space-y-4">
        {contests.map(contest => (
          <div key={contest.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <span>{contest.match?.team1Short} vs {contest.match?.team2Short}</span>
                  <span>·</span>
                  <span className="capitalize">{contest.contestType}</span>
                </div>
                <h3 className="font-semibold text-white">{contest.name}</h3>
              </div>
              <span className={cn('badge text-xs',
                contest.status === 'open' ? 'bg-green-500/10 text-green-400' :
                contest.status === 'live' ? 'bg-yellow-500/10 text-yellow-400' :
                contest.status === 'completed' ? 'bg-gray-500/10 text-gray-400' :
                'bg-blue-500/10 text-blue-400'
              )}>
                {contest.status}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-gray-400 text-xs">Prize Pool</div>
                <div className="text-yellow-400 font-bold">{formatCurrency(contest.totalPrizePool)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">Entry Fee</div>
                <div className="text-white font-medium">{contest.entryFee === 0 ? 'Free' : formatCurrency(contest.entryFee)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs flex items-center gap-1">
                  <Users className="w-3 h-3" /> Teams
                </div>
                <div className="text-white">{contest._count.entries}/{contest.maxParticipants}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">Revenue</div>
                <div className="text-green-400">{formatCurrency(contest.entryFee * contest._count.entries)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
