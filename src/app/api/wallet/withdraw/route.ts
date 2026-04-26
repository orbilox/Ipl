import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const withdrawSchema = z.object({
  amount: z.number().min(200).max(100000),
  method: z.enum(['upi', 'bank']),
  accountDetails: z.object({
    upiId: z.string().optional(),
    accountNumber: z.string().optional(),
    ifsc: z.string().optional(),
    bankName: z.string().optional(),
    accountName: z.string().optional(),
  }),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { amount, method, accountDetails } = withdrawSchema.parse(body)

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (user.balance < amount) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    if (user.kycStatus !== 'verified') return NextResponse.json({ error: 'KYC verification required' }, { status: 403 })

    // Check for pending withdrawal already
    const pendingWithdrawal = await prisma.withdrawal.findFirst({
      where: { userId: session.user.id, status: 'pending' }
    })
    if (pendingWithdrawal) return NextResponse.json({ error: 'You already have a pending withdrawal request' }, { status: 400 })

    await prisma.$transaction([
      prisma.withdrawal.create({
        data: {
          userId: session.user.id,
          amount,
          method,
          accountDetails: JSON.stringify(accountDetails),
          status: 'pending',
        }
      }),
      // Hold the balance (deduct immediately, refund if rejected)
      prisma.user.update({
        where: { id: session.user.id },
        data: { balance: { decrement: amount } }
      }),
      prisma.transaction.create({
        data: {
          userId: session.user.id,
          type: 'withdrawal',
          amount: -amount,
          balance: user.balance - amount,
          description: `Withdrawal request via ${method.toUpperCase()} — Pending approval`,
          status: 'pending',
        }
      }),
      prisma.notification.create({
        data: {
          userId: session.user.id,
          title: 'Withdrawal Request Submitted',
          message: `Your withdrawal of ₹${amount} is pending admin approval`,
          type: 'info',
        }
      }),
    ])

    return NextResponse.json({ message: 'Withdrawal request submitted. Admin will process within 24 hours.' })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const withdrawals = await prisma.withdrawal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return NextResponse.json({ withdrawals })
}
