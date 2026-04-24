import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const depositSchema = z.object({
  amount: z.number().min(100).max(100000),
  method: z.enum(['upi', 'netbanking', 'card', 'wallet']),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { amount, method } = depositSchema.parse(body)

    // In production: integrate with Razorpay
    // For demo: simulate successful payment
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const newBalance = user.balance + amount

    await prisma.$transaction([
      prisma.deposit.create({
        data: {
          userId: session.user.id,
          amount,
          method,
          gateway: 'razorpay',
          status: 'completed',
        }
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          balance: { increment: amount },
          totalDeposited: { increment: amount },
        }
      }),
      prisma.transaction.create({
        data: {
          userId: session.user.id,
          type: 'deposit',
          amount,
          balance: newBalance,
          description: `Deposit via ${method.toUpperCase()}`,
          status: 'completed',
        }
      }),
      prisma.notification.create({
        data: {
          userId: session.user.id,
          title: 'Deposit Successful',
          message: `₹${amount} has been added to your wallet`,
          type: 'success',
        }
      })
    ])

    return NextResponse.json({
      message: 'Deposit successful',
      amount,
      newBalance,
    }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Deposit failed' }, { status: 500 })
  }
}
