import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number').optional(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must have uppercase, lowercase and number'
  ),
  referralCode: z.string().optional(),
})

function generateReferralCode() {
  return 'IPL' + Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, password, referralCode } = registerSchema.parse(body)

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, ...(phone ? [{ phone }] : [])] }
    })

    if (existing) {
      return NextResponse.json(
        { error: existing.email === email.toLowerCase() ? 'Email already registered' : 'Phone already registered' },
        { status: 409 }
      )
    }

    let referredById: string | undefined
    let welcomeBonus = 50

    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode } })
      if (referrer) {
        referredById = referrer.id
        welcomeBonus = 100
        // Bonus for referrer
        await prisma.$transaction([
          prisma.user.update({
            where: { id: referrer.id },
            data: { balance: { increment: 50 } }
          }),
          prisma.transaction.create({
            data: {
              userId: referrer.id,
              type: 'bonus',
              amount: 50,
              balance: referrer.balance + 50,
              description: 'Referral bonus',
              status: 'completed',
            }
          })
        ])
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const userReferralCode = generateReferralCode()

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone,
        password: hashedPassword,
        referralCode: userReferralCode,
        referredBy: referredById,
        balance: welcomeBonus,
        bonusBalance: welcomeBonus,
      },
      select: {
        id: true, email: true, name: true, role: true, balance: true, createdAt: true
      }
    })

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'bonus',
        amount: welcomeBonus,
        balance: welcomeBonus,
        description: `Welcome bonus${referralCode ? ' + referral bonus' : ''}`,
        status: 'completed',
      }
    })

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to IPL Trading! 🏏',
        message: `You received ₹${welcomeBonus} welcome bonus. Start trading on live IPL matches!`,
        type: 'success',
      }
    })

    return NextResponse.json({ user, message: 'Account created successfully' }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
