import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

function isAdmin(role: string) { return role === 'admin' || role === 'superadmin' }

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'pending'

  const deposits = await prisma.deposit.findMany({
    where: status === 'all' ? {} : { status },
    include: { user: { select: { id: true, name: true, email: true, phone: true, balance: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ deposits })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { depositId, action, adminNote } = await req.json()
  if (!depositId || !action) return NextResponse.json({ error: 'Missing depositId or action' }, { status: 400 })

  const deposit = await prisma.deposit.findUnique({ where: { id: depositId }, include: { user: true } })
  if (!deposit) return NextResponse.json({ error: 'Deposit not found' }, { status: 404 })
  if (deposit.status !== 'pending') return NextResponse.json({ error: 'Already processed' }, { status: 400 })

  if (action === 'approve') {
    const newBalance = deposit.user.balance + deposit.amount
    await prisma.$transaction([
      prisma.deposit.update({
        where: { id: depositId },
        data: { status: 'approved', adminNote: adminNote || null, approvedAt: new Date() }
      }),
      prisma.user.update({
        where: { id: deposit.userId },
        data: { balance: { increment: deposit.amount }, totalDeposited: { increment: deposit.amount } }
      }),
      prisma.transaction.create({
        data: {
          userId: deposit.userId,
          type: 'deposit',
          amount: deposit.amount,
          balance: newBalance,
          description: `Deposit approved — UTR: ${deposit.utrNumber}`,
          status: 'completed',
          referenceId: deposit.id,
        }
      }),
      prisma.notification.create({
        data: {
          userId: deposit.userId,
          title: 'Deposit Approved!',
          message: `₹${deposit.amount} has been credited to your wallet. UTR: ${deposit.utrNumber}`,
          type: 'success',
        }
      }),
    ])
    return NextResponse.json({ message: `Deposit of ₹${deposit.amount} approved and credited to ${deposit.user.name}` })
  }

  if (action === 'reject') {
    await prisma.$transaction([
      prisma.deposit.update({
        where: { id: depositId },
        data: { status: 'rejected', adminNote: adminNote || 'Rejected by admin' }
      }),
      prisma.notification.create({
        data: {
          userId: deposit.userId,
          title: 'Deposit Rejected',
          message: `Your deposit of ₹${deposit.amount} was rejected. ${adminNote || 'Contact support for help.'}`,
          type: 'error',
        }
      }),
    ])
    return NextResponse.json({ message: 'Deposit rejected' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
