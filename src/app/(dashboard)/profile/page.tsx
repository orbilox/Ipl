import TopBar from '@/components/layout/TopBar'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Shield, Mail, Phone, Calendar, Copy, Award } from 'lucide-react'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      kycStatus: true, isVerified: true, referralCode: true,
      balance: true, bonusBalance: true, totalDeposited: true,
      totalWithdrawn: true, totalWon: true, totalLost: true,
      createdAt: true,
      _count: { select: { trades: true, bets: true, contestEntries: true } }
    }
  })

  if (!user) return null

  return (
    <>
      <TopBar title="Profile" />
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        {/* Profile Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-black text-2xl">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-xl text-white">{user.name}</h2>
              <p className="text-gray-400 text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge text-xs ${user.role === 'superadmin' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  {user.role === 'superadmin' ? '👑 Super Admin' : user.role === 'admin' ? '🔐 Admin' : '🏏 Trader'}
                </span>
                <span className={`badge text-xs ${user.kycStatus === 'verified' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                  {user.kycStatus === 'verified' ? '✓ KYC Verified' : '⏳ KYC Pending'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-gray-400">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-gray-400">+91 {user.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-400">Joined {formatDate(user.createdAt)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className="text-gray-400">Referral Code: </span>
              <span className="text-orange-400 font-mono font-bold">{user.referralCode}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Wallet Balance', value: formatCurrency(user.balance), color: 'text-white' },
            { label: 'Bonus Balance', value: formatCurrency(user.bonusBalance), color: 'text-yellow-400' },
            { label: 'Total Deposited', value: formatCurrency(user.totalDeposited), color: 'text-green-400' },
            { label: 'Total Withdrawn', value: formatCurrency(user.totalWithdrawn), color: 'text-orange-400' },
            { label: 'Total Won', value: formatCurrency(user.totalWon), color: 'text-green-400' },
            { label: 'Total Lost', value: formatCurrency(user.totalLost), color: 'text-red-400' },
          ].map(stat => (
            <div key={stat.label} className="stat-card">
              <div className="text-gray-400 text-xs">{stat.label}</div>
              <div className={`font-bold text-lg ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Activity */}
        <div className="card p-5 mb-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-orange-400" />
            Activity Stats
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-bold text-2xl text-white">{user._count.trades}</div>
              <div className="text-gray-400 text-xs">Trades</div>
            </div>
            <div>
              <div className="font-bold text-2xl text-white">{user._count.bets}</div>
              <div className="text-gray-400 text-xs">Bets</div>
            </div>
            <div>
              <div className="font-bold text-2xl text-white">{user._count.contestEntries}</div>
              <div className="text-gray-400 text-xs">Contests</div>
            </div>
          </div>
        </div>

        {/* Referral */}
        <div className="card p-5 bg-gradient-to-r from-orange-500/10 to-red-500/5 border-orange-500/20">
          <h3 className="font-semibold text-white mb-2">Refer & Earn</h3>
          <p className="text-gray-400 text-sm mb-3">Share your code and earn ₹50 for each friend who joins!</p>
          <div className="flex items-center gap-3 bg-gray-900/50 rounded-xl p-3">
            <span className="text-orange-400 font-mono font-bold flex-1">{user.referralCode}</span>
            <button className="text-gray-400 hover:text-white transition-colors">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
