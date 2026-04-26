import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const depositSchema = z.object({
  amount: z.number().min(100).max(100000),
  utrNumber: z.string().min(6, 'Enter a valid UTR/Transaction ID'),
  screenshotUrl: z.string().optional(),
  method: z.enum(['upi', 'bank']).default('upi'),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { amount, utrNumber, screenshotUrl, method } = depositSchema.parse(body)

    // Check for duplicate UTR
    const existing = await prisma.deposit.findFirst({ where: { utrNumber } })
    if (existing) return NextResponse.json({ error: 'This UTR/Transaction ID has already been submitted' }, { status: 400 })

    const deposit = await prisma.deposit.create({
      data: {
        userId: session.user.id,
        amount,
        method,
        utrNumber,
        screenshotUrl: screenshotUrl || null,
        status: 'pending',
      }
    })

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: 'Deposit Request Submitted',
        message: `Your deposit of ₹${amount} is under review. UTR: ${utrNumber}`,
        type: 'info',
      }
    })

    return NextResponse.json({ message: 'Deposit request submitted successfully. Admin will verify and credit within 30 minutes.', depositId: deposit.id })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const deposits = await prisma.deposit.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return NextResponse.json({ deposits })
}
