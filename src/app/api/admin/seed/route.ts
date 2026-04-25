/**
 * One-time database seed endpoint.
 * GET /api/admin/seed?secret=CRON_SECRET
 * Run this once after deploying to populate demo data.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

function isAuthorized(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  return secret === process.env.CRON_SECRET
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized — add ?secret=YOUR_CRON_SECRET' }, { status: 401 })
  }

  try {
    // Check if already seeded
    const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@ipltrading.com' } })
    if (existingAdmin) {
      return NextResponse.json({ message: 'Already seeded — database has data', skipped: true })
    }

    // App settings
    const settings = [
      { key: 'min_deposit', value: '100', description: 'Minimum deposit (INR)' },
      { key: 'max_deposit', value: '100000', description: 'Maximum deposit (INR)' },
      { key: 'min_withdrawal', value: '200', description: 'Minimum withdrawal (INR)' },
      { key: 'max_bet', value: '10000', description: 'Max bet per trade (INR)' },
      { key: 'platform_commission', value: '10', description: 'Platform commission %' },
      { key: 'welcome_bonus', value: '50', description: 'Welcome bonus (INR)' },
    ]
    for (const s of settings) {
      await prisma.appSetting.upsert({ where: { key: s.key }, update: {}, create: s })
    }

    // Admin
    const adminPw = await bcrypt.hash('Admin@123456', 12)
    await prisma.user.upsert({
      where: { email: 'admin@ipltrading.com' },
      update: {},
      create: {
        email: 'admin@ipltrading.com', name: 'Super Admin',
        password: adminPw, role: 'superadmin',
        isVerified: true, kycStatus: 'verified',
        balance: 999999, referralCode: 'ADMIN001',
      }
    })

    // Demo users
    const demoPw = await bcrypt.hash('Demo@12345', 10)
    const demoUsers = [
      { email: 'rahul@demo.com', name: 'Rahul Sharma', referralCode: 'RAHUL01', balance: 5000 },
      { email: 'priya@demo.com', name: 'Priya Patel', referralCode: 'PRIYA01', balance: 2500 },
      { email: 'amit@demo.com', name: 'Amit Kumar', referralCode: 'AMIT001', balance: 10000 },
    ]
    for (const u of demoUsers) {
      await prisma.user.upsert({
        where: { email: u.email }, update: {},
        create: { ...u, password: demoPw, role: 'user', isVerified: true, kycStatus: 'verified' }
      })
    }

    // Matches
    const now = new Date()
    const matches = [
      {
        team1: 'Royal Challengers Bengaluru', team1Short: 'RCB',
        team2: 'Kolkata Knight Riders', team2Short: 'KKR',
        venue: 'M. Chinnaswamy Stadium', city: 'Bengaluru',
        series: 'IPL 2025', matchNumber: 35,
        startTime: new Date(now.getTime() - 60 * 60 * 1000),
        status: 'live' as const,
        currentInnings: 1,
        team1Runs: 87, team1Wickets: 3, team1Overs: '11.2',
        team1Score: '87/3', team2Score: null,
        team1Odds: 1.85, team2Odds: 2.05,
        featuredMatch: true,
      },
      {
        team1: 'Mumbai Indians', team1Short: 'MI',
        team2: 'Chennai Super Kings', team2Short: 'CSK',
        venue: 'Wankhede Stadium', city: 'Mumbai',
        series: 'IPL 2025', matchNumber: 36,
        startTime: new Date(now.getTime() + 3 * 60 * 60 * 1000),
        status: 'upcoming' as const,
        team1Odds: 1.9, team2Odds: 2.0,
      },
      {
        team1: 'Delhi Capitals', team1Short: 'DC',
        team2: 'Punjab Kings', team2Short: 'PBKS',
        venue: 'Arun Jaitley Stadium', city: 'Delhi',
        series: 'IPL 2025', matchNumber: 34,
        startTime: new Date(now.getTime() - 5 * 60 * 60 * 1000),
        status: 'completed' as const,
        team1Runs: 198, team1Wickets: 4, team1Overs: '20.0',
        team2Runs: 192, team2Wickets: 8, team2Overs: '20.0',
        team1Score: '198/4', team2Score: '192/8',
        winnerTeam: 'DC', result: 'Delhi Capitals won by 6 runs',
        team1Odds: 1.0, team2Odds: 5.0,
      },
    ]

    for (const m of matches) {
      await prisma.match.create({ data: m as any })
    }

    return NextResponse.json({
      message: 'Database seeded successfully!',
      seeded: {
        users: demoUsers.length + 1,
        matches: matches.length,
        settings: settings.length,
      },
      logins: {
        admin: 'admin@ipltrading.com / Admin@123456',
        user: 'rahul@demo.com / Demo@12345',
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
