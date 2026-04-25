/**
 * One-time database seed endpoint.
 * GET /api/admin/seed        — seed if empty
 * GET /api/admin/seed?reset=true — wipe and re-seed
 *
 * NO hardcoded scores or results — all live data comes from Cricbuzz automatically.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const reset = req.nextUrl.searchParams.get('reset') === 'true'

  try {
    if (reset) {
      await prisma.trade.deleteMany()
      await prisma.bet.deleteMany()
      await prisma.contestEntry.deleteMany()
      await prisma.contest.deleteMany()
      await prisma.match.deleteMany()
      await prisma.transaction.deleteMany()
      await prisma.notification.deleteMany()
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

    // ── IPL 2026 Match Schedule ────────────────────────────────────────────
    // NO scores or results hardcoded — Cricbuzz fills all live data every 60s
    // Team short names match Cricbuzz exactly (DC, PBKS, RR, SRH, MI, KKR etc.)
    const now = new Date()

    const t = (hoursFromNow: number, h = 19, m = 30) => {
      const d = new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000)
      d.setHours(h, m, 0, 0)
      return d
    }

    const matches = [
      // Match 35 — DC vs PBKS — already played today, mark upcoming so admin can set correct result
      {
        team1: 'Delhi Capitals',      team1Short: 'DC',
        team2: 'Punjab Kings',         team2Short: 'PBKS',
        venue: 'Arun Jaitley Stadium', city: 'Delhi',
        series: 'IPL 2026',            matchNumber: 35,
        startTime: t(-5),
        status: 'upcoming' as const,   // Admin sets to completed with real result
        team1Odds: 1.9, team2Odds: 2.0,
        featuredMatch: false,
      },
      // Match 36 — RR vs SRH — LIVE tonight, Cricbuzz will auto-update
      {
        team1: 'Rajasthan Royals',       team1Short: 'RR',
        team2: 'Sunrisers Hyderabad',    team2Short: 'SRH',
        venue: 'Sawai Mansingh Stadium', city: 'Jaipur',
        series: 'IPL 2026',              matchNumber: 36,
        startTime: t(0, 19, 30),
        status: 'live' as const,
        currentInnings: 1,
        team1Runs: 0, team1Wickets: 0, team1Overs: '0.0',
        team1Score: '0/0',
        team1Odds: 1.9, team2Odds: 2.0,
        featuredMatch: true,
      },
      // Upcoming matches — no scores, just schedule
      {
        team1: 'Mumbai Indians',       team1Short: 'MI',
        team2: 'Kolkata Knight Riders', team2Short: 'KKR',
        venue: 'Wankhede Stadium',     city: 'Mumbai',
        series: 'IPL 2026',            matchNumber: 37,
        startTime: t(24, 19, 30),
        status: 'upcoming' as const,
        team1Odds: 1.85, team2Odds: 2.1,
        featuredMatch: false,
      },
      {
        team1: 'Chennai Super Kings',         team1Short: 'CSK',
        team2: 'Royal Challengers Bengaluru', team2Short: 'RCB',
        venue: 'MA Chidambaram Stadium',      city: 'Chennai',
        series: 'IPL 2026',                   matchNumber: 38,
        startTime: t(48, 19, 30),
        status: 'upcoming' as const,
        team1Odds: 1.75, team2Odds: 2.2,
        featuredMatch: false,
      },
      {
        team1: 'Gujarat Titans',        team1Short: 'GT',
        team2: 'Lucknow Super Giants',  team2Short: 'LSG',
        venue: 'Narendra Modi Stadium', city: 'Ahmedabad',
        series: 'IPL 2026',             matchNumber: 39,
        startTime: t(72, 19, 30),
        status: 'upcoming' as const,
        team1Odds: 1.95, team2Odds: 1.95,
        featuredMatch: false,
      },
      {
        team1: 'Royal Challengers Bengaluru', team1Short: 'RCB',
        team2: 'Punjab Kings',               team2Short: 'PBKS',
        venue: 'M. Chinnaswamy Stadium',     city: 'Bengaluru',
        series: 'IPL 2026',                  matchNumber: 40,
        startTime: t(96, 19, 30),
        status: 'upcoming' as const,
        team1Odds: 2.0, team2Odds: 1.9,
        featuredMatch: false,
      },
    ]

    for (const m of matches) {
      await prisma.match.create({ data: m as any })
    }

    return NextResponse.json({
      message: 'Seeded IPL 2026 schedule. No fake scores — all live data from Cricbuzz.',
      note: 'Match 35 (DC vs PBKS) is marked upcoming — go to Admin → Matches and set the real result manually.',
      seeded: { users: demoUsers.length + 1, matches: matches.length },
      logins: {
        admin: 'admin@ipltrading.com / Admin@123456',
        user: 'rahul@demo.com / Demo@12345',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
