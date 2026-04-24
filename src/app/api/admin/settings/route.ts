import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

function isAdmin(role: string) {
  return role === 'admin' || role === 'superadmin'
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const settings = await prisma.appSetting.findMany()
  return NextResponse.json({ settings })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { key, value } = await req.json()
    const setting = await prisma.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    })
    return NextResponse.json({ setting })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
  }
}
