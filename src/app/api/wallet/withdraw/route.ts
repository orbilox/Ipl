import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const withdrawSchema = z.object({
  amount: z.number().min(200).max(100000),
  method: z.enum(['bank', 'upi', 'paytm']),
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
    if (user.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }
    if (user.kycStatus !== 'verified') {
      return NextResponse.json({ error: 'KYC verification required for withdrawals' }, { status: 403 })
    }

    const newBalance = user.balance - amount

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
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          balance: { decrement: amount },
          totalWithdrawn: { increment: amount },
        }
      }),
      prisma.transaction.create({
        data: {
          userId: session.user.id,
          type: 'withdrawal',
          amount: -amount,
          balance: newBalance,
          description: `Withdrawal via ${method.toUpperCase()} - Pending`,
          status: 'pending',
        }
      }),
      prisma.notification.create({
        data: {
          userId: session.user.id,
          title: 'Withdrawal Requested',
          message: `Your withdrawal request of ₹${amount} is being processed`,
          type: 'info',
        }
      })
    ])

    return NextResponse.json({
      message: 'Withdrawal request submitted. Processing within 24 hours.',
      amount,
      newBalance,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Withdrawal failed' }, { status: 500 })
  }
}
