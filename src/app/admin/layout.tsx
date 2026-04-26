import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AdminSidebar from './AdminSidebar'
import AdminTopBar from './AdminTopBar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
    redirect('/login')
  }

  const [pendingDeposits, pendingWithdrawals] = await Promise.all([
    prisma.deposit.count({ where: { status: 'pending' } }),
    prisma.withdrawal.count({ where: { status: 'pending' } }),
  ])

  return (
    <div className="admin-panel flex h-screen bg-[#0d1117] overflow-hidden">
      <AdminSidebar userRole={session.user.role} userName={session.user.name || ''} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AdminTopBar
          pendingDeposits={pendingDeposits}
          pendingWithdrawals={pendingWithdrawals}
          adminName={session.user.name || ''}
          adminRole={session.user.role}
        />
        <main className="flex-1 overflow-y-auto bg-[#0d1117]">
          {children}
        </main>
      </div>
    </div>
  )
}
