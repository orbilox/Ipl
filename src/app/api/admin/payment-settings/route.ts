import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const PAYMENT_KEYS = ['payment_upi_id', 'payment_qr_url', 'payment_bank_name', 'payment_account_number', 'payment_ifsc', 'payment_account_name', 'payment_note']

function isAdmin(role: string) { return role === 'admin' || role === 'superadmin' }

export async function GET() {
  const settings = await prisma.appSetting.findMany({ where: { key: { in: PAYMENT_KEYS } } })
  const result: Record<string, string> = {}
  for (const s of settings) result[s.key] = s.value
  return NextResponse.json({ settings: result })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  for (const key of PAYMENT_KEYS) {
    if (body[key] !== undefined) {
      await prisma.appSetting.upsert({
        where: { key },
        update: { value: String(body[key]) },
        create: { key, value: String(body[key]), description: key.replace(/_/g, ' ') },
      })
    }
  }

  return NextResponse.json({ message: 'Payment settings updated' })
}
