/**
 * One-time database seed endpoint.
 * GET /api/admin/seed
 * Run once after deploying to populate demo data.
 * GET /api/admin/seed?reset=true  — wipe and re-seed
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const reset = req.nextUrl.searchParams.get('reset') === 'true'

  try {
    if (reset) {
      await prisma.match.deleteMany()
      await prisma.user.deleteMany()
      await prisma.appSetting.deleteMany()
    } else {
      const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@ipltrading.com' } })
      if (existingAdmin) {
        return NextResponse.json({ message: 'Already seeded. Use ?reset=true to re-seed.', skipped: true })
      }
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

    // ── IPL 2025 Actual Schedule ───────────────────────────────────────────
    // Team short names MUST match Cricbuzz exactly for live score auto-update
    const now = new Date()
    const today730pm = new Date()
    today730pm.setHours(19, 30, 0, 0)
    const tomorrow730pm = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    tomorrow730pm.setHours(19, 30, 0, 0)
    const dayAfter730pm = new Date(now.getTime() + 48 * 60 * 60 * 1000)
    dayAfter730pm.setHours(19, 30, 0, 0)

    const matches = [
      // Match 35 — DC vs PBKS (completed earlier today per Google)
      {
        team1: 'Delhi Capitals', team1Short: 'DC',
        team2: 'Punjab Kings', team2Short: 'PBKS',
        venue: 'Arun Jaitley Stadium', city: 'Delhi',
        series: 'IPL 2025', matchNumber: 35,
        startTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        status: 'completed' as const,
        team1Runs: 152, team1Wickets: 6, team1Overs: '20.0',
        team2Runs: 148, team2Wickets: 9, team2Overs: '20.0',
        team1Score: '152/6', team2Score: '148/9',
        currentInnings: 2,
        winnerTeam: 'DC',
        result: 'Delhi Capitals won by 4 runs',
        team1Odds: 1.0, team2Odds: 8.0,
        featuredMatch: false,
      },
      // Match 36 — RR vs SRH (today 7:30 PM — set live so Cricbuzz picks it up)
      {
        team1: 'Rajasthan Royals', team1Short: 'RR',
        team2: 'Sunrisers Hyderabad', team2Short: 'SRH',
        venue: 'Sawai Mansingh Stadium', city: 'Jaipur',
        series: 'IPL 2025', matchNumber: 36,
        startTime: today730pm,
        status: 'live' as const,
        currentInnings: 1,
        team1Runs: 0, team1Wickets: 0, team1Overs: '0.0',
        team1Score: '0/0', team2Score: null,
        team1Odds: 1.9, team2Odds: 2.0,
        featuredMatch: true,
      },
      // Match 37 — MI vs KKR (tomorrow)
      {
        team1: 'Mumbai Indians', team1Short: 'MI',
        team2: 'Kolkata Knight Riders', team2Short: 'KKR',
        venue: 'Wankhede Stadium', city: 'Mumbai',
        series: 'IPL 2025', matchNumber: 37,
        startTime: tomorrow730pm,
        status: 'upcoming' as const,
        team1Odds: 1.85, team2Odds: 2.1,
        featuredMatch: false,
      },
      // Match 38 — CSK vs RCB (day after)
      {
        team1: 'Chennai Super Kings', team1Short: 'CSK',
        team2: 'Royal Challengers Bengaluru', team2Short: 'RCB',
        venue: 'MA Chidambaram Stadium', city: 'Chennai',
        series: 'IPL 2025', matchNumber: 38,
        startTime: dayAfter730pm,
        status: 'upcoming' as const,
        team1Odds: 1.75, team2Odds: 2.2,
        featuredMatch: false,
      },
      // Match 39 — GT vs LSG
      {
        team1: 'Gujarat Titans', team1Short: 'GT',
        team2: 'Lucknow Super Giants', team2Short: 'LSG',
        venue: 'Narendra Modi Stadium', city: 'Ahmedabad',
        series: 'IPL 2025', matchNumber: 39,
        startTime: new Date(now.getTime() + 72 * 60 * 60 * 1000),
        status: 'upcoming' as const,
        team1Odds: 1.95, team2Odds: 1.95,
        featuredMatch: false,
      },
    ]

    for (const m of matches) {
      await prisma.match.create({ data: m as any })
    }

    return NextResponse.json({
      message: 'Database seeded successfully with IPL 2025 matches!',
      seeded: {
        users: demoUsers.length + 1,
        matches: matches.length,
        settings: settings.length,
      },
      logins: {
        admin: 'admin@ipltrading.com / Admin@123456',
        user: 'rahul@demo.com / Demo@12345',
      },
      liveMatch: 'RR vs SRH — Cricbuzz will auto-update scores every minute',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
