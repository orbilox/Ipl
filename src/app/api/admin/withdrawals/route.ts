import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

function isAdmin(role: string) {
  return role === 'admin' || role === 'superadmin'
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'pending'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20

  const [withdrawals, total] = await Promise.all([
    prisma.withdrawal.findMany({
      where: { status },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.withdrawal.count({ where: { status } })
  ])

  return NextResponse.json({ withdrawals, total, pages: Math.ceil(total / limit) })
}

const processWithdrawalSchema = z.object({
  withdrawalId: z.string(),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { withdrawalId, action, rejectionReason } = processWithdrawalSchema.parse(body)

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: true }
    })

    if (!withdrawal) return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 })
    if (withdrawal.status !== 'pending') {
      return NextResponse.json({ error: 'Withdrawal already processed' }, { status: 400 })
    }

    if (action === 'approve') {
      await prisma.$transaction([
        prisma.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: 'completed', processedAt: new Date() }
        }),
        prisma.transaction.updateMany({
          where: {
            userId: withdrawal.userId,
            type: 'withdrawal',
            status: 'pending',
          },
          data: { status: 'completed' }
        }),
        prisma.notification.create({
          data: {
            userId: withdrawal.userId,
            title: 'Withdrawal Approved',
            message: `Your withdrawal of ₹${withdrawal.amount} has been processed`,
            type: 'success',
          }
        })
      ])
    } else {
      // Refund balance
      await prisma.$transaction([
        prisma.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: 'rejected', rejectionReason: rejectionReason || 'Rejected by admin' }
        }),
        prisma.user.update({
          where: { id: withdrawal.userId },
          data: {
            balance: { increment: withdrawal.amount },
            totalWithdrawn: { decrement: withdrawal.amount }
          }
        }),
        prisma.transaction.create({
          data: {
            userId: withdrawal.userId,
            type: 'refund',
            amount: withdrawal.amount,
            balance: withdrawal.user.balance + withdrawal.amount,
            description: `Withdrawal rejected: ${rejectionReason || 'Rejected by admin'}`,
            status: 'completed',
          }
        }),
        prisma.notification.create({
          data: {
            userId: withdrawal.userId,
            title: 'Withdrawal Rejected',
            message: `Your withdrawal of ₹${withdrawal.amount} was rejected. Amount refunded.`,
            type: 'error',
          }
        })
      ])
    }

    return NextResponse.json({ message: `Withdrawal ${action === 'approve' ? 'approved' : 'rejected'} successfully` })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 })
  }
}
