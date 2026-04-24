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

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const limit = 20

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, name: true, phone: true, role: true,
          isVerified: true, isActive: true, kycStatus: true,
          balance: true, totalDeposited: true, totalWithdrawn: true,
          totalWon: true, createdAt: true,
          _count: { select: { trades: true, bets: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({ users, total, pages: Math.ceil(total / limit) })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

const updateUserSchema = z.object({
  userId: z.string(),
  action: z.enum(['activate', 'deactivate', 'add_balance', 'deduct_balance', 'verify_kyc', 'reject_kyc', 'update_role']),
  amount: z.number().optional(),
  role: z.string().optional(),
  note: z.string().optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { userId, action, amount, role, note } = updateUserSchema.parse(body)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    switch (action) {
      case 'activate':
        await prisma.user.update({ where: { id: userId }, data: { isActive: true } })
        break

      case 'deactivate':
        await prisma.user.update({ where: { id: userId }, data: { isActive: false } })
        break

      case 'add_balance':
        if (!amount) return NextResponse.json({ error: 'Amount required' }, { status: 400 })
        await prisma.$transaction([
          prisma.user.update({ where: { id: userId }, data: { balance: { increment: amount } } }),
          prisma.transaction.create({
            data: {
              userId,
              type: 'bonus',
              amount,
              balance: user.balance + amount,
              description: `Balance added by admin: ${note || 'Admin credit'}`,
              status: 'completed',
            }
          })
        ])
        break

      case 'deduct_balance':
        if (!amount) return NextResponse.json({ error: 'Amount required' }, { status: 400 })
        if (user.balance < amount) return NextResponse.json({ error: 'Insufficient user balance' }, { status: 400 })
        await prisma.$transaction([
          prisma.user.update({ where: { id: userId }, data: { balance: { decrement: amount } } }),
          prisma.transaction.create({
            data: {
              userId,
              type: 'deduction',
              amount: -amount,
              balance: user.balance - amount,
              description: `Balance deducted by admin: ${note || 'Admin debit'}`,
              status: 'completed',
            }
          })
        ])
        break

      case 'verify_kyc':
        await prisma.user.update({ where: { id: userId }, data: { kycStatus: 'verified', isVerified: true } })
        break

      case 'reject_kyc':
        await prisma.user.update({ where: { id: userId }, data: { kycStatus: 'rejected' } })
        break

      case 'update_role':
        if (!role || session.user.role !== 'superadmin') {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        await prisma.user.update({ where: { id: userId }, data: { role } })
        break
    }

    return NextResponse.json({ message: 'User updated successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
