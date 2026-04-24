import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function generateReferralCode() {
  return 'IPL' + Math.random().toString(36).substring(2, 8).toUpperCase()
}

async function main() {
  console.log('🌱 Seeding database...')

  // App settings
  await prisma.appSetting.upsert({
    where: { key: 'min_deposit' },
    update: {},
    create: { key: 'min_deposit', value: '100', description: 'Minimum deposit amount in INR' }
  })
  await prisma.appSetting.upsert({
    where: { key: 'max_deposit' },
    update: {},
    create: { key: 'max_deposit', value: '100000', description: 'Maximum deposit amount in INR' }
  })
  await prisma.appSetting.upsert({
    where: { key: 'min_withdrawal' },
    update: {},
    create: { key: 'min_withdrawal', value: '200', description: 'Minimum withdrawal amount in INR' }
  })
  await prisma.appSetting.upsert({
    where: { key: 'max_bet' },
    update: {},
    create: { key: 'max_bet', value: '10000', description: 'Maximum bet amount per trade' }
  })
  await prisma.appSetting.upsert({
    where: { key: 'platform_commission' },
    update: {},
    create: { key: 'platform_commission', value: '10', description: 'Platform commission percentage' }
  })
  await prisma.appSetting.upsert({
    where: { key: 'welcome_bonus' },
    update: {},
    create: { key: 'welcome_bonus', value: '50', description: 'Welcome bonus for new users in INR' }
  })

  // Admin user
  const adminPassword = await bcrypt.hash('Admin@123456', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ipltrading.com' },
    update: {},
    create: {
      email: 'admin@ipltrading.com',
      name: 'Super Admin',
      password: adminPassword,
      role: 'superadmin',
      isVerified: true,
      kycStatus: 'verified',
      balance: 999999,
      referralCode: 'ADMIN001',
    }
  })

  // Demo users
  const users = []
  const demoUsers = [
    { name: 'Rahul Sharma', email: 'rahul@demo.com', balance: 5000 },
    { name: 'Priya Patel', email: 'priya@demo.com', balance: 8500 },
    { name: 'Amit Kumar', email: 'amit@demo.com', balance: 12000 },
    { name: 'Sneha Gupta', email: 'sneha@demo.com', balance: 3200 },
    { name: 'Rohan Mehta', email: 'rohan@demo.com', balance: 7800 },
  ]
  const userPassword = await bcrypt.hash('Demo@12345', 12)
  for (const u of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        password: userPassword,
        role: 'user',
        isVerified: true,
        kycStatus: 'verified',
        balance: u.balance,
        referralCode: generateReferralCode(),
      }
    })
    users.push(user)
  }

  // IPL Teams and Players
  const iplTeams = [
    { name: 'Mumbai Indians', short: 'MI' },
    { name: 'Chennai Super Kings', short: 'CSK' },
    { name: 'Royal Challengers Bangalore', short: 'RCB' },
    { name: 'Kolkata Knight Riders', short: 'KKR' },
    { name: 'Delhi Capitals', short: 'DC' },
    { name: 'Sunrisers Hyderabad', short: 'SRH' },
    { name: 'Rajasthan Royals', short: 'RR' },
    { name: 'Punjab Kings', short: 'PBKS' },
    { name: 'Lucknow Super Giants', short: 'LSG' },
    { name: 'Gujarat Titans', short: 'GT' },
  ]

  const playerData = [
    // MI
    { name: 'Rohit Sharma', team: 'MI', role: 'batsman', creditValue: 10.5 },
    { name: 'Jasprit Bumrah', team: 'MI', role: 'bowler', creditValue: 10.0 },
    { name: 'Suryakumar Yadav', team: 'MI', role: 'batsman', creditValue: 10.5 },
    { name: 'Hardik Pandya', team: 'MI', role: 'allrounder', creditValue: 10.0 },
    { name: 'Ishan Kishan', team: 'MI', role: 'wicketkeeper', creditValue: 9.0 },
    // CSK
    { name: 'MS Dhoni', team: 'CSK', role: 'wicketkeeper', creditValue: 10.0 },
    { name: 'Ruturaj Gaikwad', team: 'CSK', role: 'batsman', creditValue: 9.5 },
    { name: 'Ravindra Jadeja', team: 'CSK', role: 'allrounder', creditValue: 9.5 },
    { name: 'Deepak Chahar', team: 'CSK', role: 'bowler', creditValue: 8.5 },
    { name: 'Devon Conway', team: 'CSK', role: 'batsman', creditValue: 9.0 },
    // RCB
    { name: 'Virat Kohli', team: 'RCB', role: 'batsman', creditValue: 11.0 },
    { name: 'Glenn Maxwell', team: 'RCB', role: 'allrounder', creditValue: 9.5 },
    { name: 'Faf du Plessis', team: 'RCB', role: 'batsman', creditValue: 9.5 },
    { name: 'Mohammed Siraj', team: 'RCB', role: 'bowler', creditValue: 9.0 },
    // KKR
    { name: 'Shreyas Iyer', team: 'KKR', role: 'batsman', creditValue: 9.5 },
    { name: 'Andre Russell', team: 'KKR', role: 'allrounder', creditValue: 10.0 },
    { name: 'Sunil Narine', team: 'KKR', role: 'allrounder', creditValue: 9.5 },
    { name: 'Varun Chakravarthy', team: 'KKR', role: 'bowler', creditValue: 8.5 },
    // SRH
    { name: 'Pat Cummins', team: 'SRH', role: 'allrounder', creditValue: 9.5 },
    { name: 'Heinrich Klaasen', team: 'SRH', role: 'wicketkeeper', creditValue: 9.0 },
    { name: 'Travis Head', team: 'SRH', role: 'batsman', creditValue: 9.5 },
    // RR
    { name: 'Sanju Samson', team: 'RR', role: 'wicketkeeper', creditValue: 9.5 },
    { name: 'Jos Buttler', team: 'RR', role: 'batsman', creditValue: 10.0 },
    { name: 'Yuzvendra Chahal', team: 'RR', role: 'bowler', creditValue: 9.0 },
    // DC
    { name: 'Rishabh Pant', team: 'DC', role: 'wicketkeeper', creditValue: 10.0 },
    { name: 'David Warner', team: 'DC', role: 'batsman', creditValue: 9.5 },
    // LSG
    { name: 'KL Rahul', team: 'LSG', role: 'wicketkeeper', creditValue: 10.0 },
    { name: 'Nicholas Pooran', team: 'LSG', role: 'wicketkeeper', creditValue: 9.0 },
    // GT
    { name: 'Shubman Gill', team: 'GT', role: 'batsman', creditValue: 9.5 },
    { name: 'Rashid Khan', team: 'GT', role: 'bowler', creditValue: 10.0 },
  ]

  for (const p of playerData) {
    await prisma.player.upsert({
      where: { externalId: p.name.toLowerCase().replace(/\s/g, '_') },
      update: {},
      create: {
        externalId: p.name.toLowerCase().replace(/\s/g, '_'),
        name: p.name,
        team: p.team,
        role: p.role,
        creditValue: p.creditValue,
      }
    })
  }

  // IPL 2025 Matches
  const now = new Date()
  const matches = [
    {
      team1: 'Mumbai Indians', team1Short: 'MI',
      team2: 'Chennai Super Kings', team2Short: 'CSK',
      venue: 'Wankhede Stadium', city: 'Mumbai',
      startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      status: 'upcoming', matchNumber: 1,
      team1Odds: 1.85, team2Odds: 2.10,
      featuredMatch: true,
    },
    {
      team1: 'Royal Challengers Bangalore', team1Short: 'RCB',
      team2: 'Kolkata Knight Riders', team2Short: 'KKR',
      venue: 'M. Chinnaswamy Stadium', city: 'Bangalore',
      startTime: new Date(now.getTime() - 30 * 60 * 1000),
      status: 'live', matchNumber: 2,
      team1Score: '187/5', team2Score: '45/2',
      team1Runs: 187, team1Wickets: 5, team1Overs: '20.0',
      team2Runs: 45, team2Wickets: 2, team2Overs: '6.2',
      currentInnings: 2,
      requiredRuns: 143, requiredOvers: '13.4',
      team1Odds: 1.45, team2Odds: 2.80,
      featuredMatch: true,
    },
    {
      team1: 'Rajasthan Royals', team1Short: 'RR',
      team2: 'Delhi Capitals', team2Short: 'DC',
      venue: 'Sawai Mansingh Stadium', city: 'Jaipur',
      startTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      status: 'completed', matchNumber: 3,
      team1Score: '201/4', team2Score: '188/7',
      team1Runs: 201, team1Wickets: 4, team1Overs: '20.0',
      team2Runs: 188, team2Wickets: 7, team2Overs: '20.0',
      result: 'Rajasthan Royals won by 13 runs',
      winnerTeam: 'RR',
      team1Odds: 1.90, team2Odds: 2.00,
    },
    {
      team1: 'Sunrisers Hyderabad', team1Short: 'SRH',
      team2: 'Punjab Kings', team2Short: 'PBKS',
      venue: 'Rajiv Gandhi Stadium', city: 'Hyderabad',
      startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      status: 'upcoming', matchNumber: 4,
      team1Odds: 1.75, team2Odds: 2.20,
    },
    {
      team1: 'Gujarat Titans', team1Short: 'GT',
      team2: 'Lucknow Super Giants', team2Short: 'LSG',
      venue: 'Narendra Modi Stadium', city: 'Ahmedabad',
      startTime: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      status: 'upcoming', matchNumber: 5,
      team1Odds: 2.00, team2Odds: 1.90,
    },
    {
      team1: 'Chennai Super Kings', team1Short: 'CSK',
      team2: 'Royal Challengers Bangalore', team2Short: 'RCB',
      venue: 'MA Chidambaram Stadium', city: 'Chennai',
      startTime: new Date(now.getTime() + 72 * 60 * 60 * 1000),
      status: 'upcoming', matchNumber: 6,
      team1Odds: 1.80, team2Odds: 2.15,
    },
  ]

  const createdMatches = []
  for (const m of matches) {
    const match = await prisma.match.upsert({
      where: { externalId: `ipl2025_match${m.matchNumber}` },
      update: {
        status: m.status,
        team1Runs: m.team1Runs,
        team1Wickets: m.team1Wickets,
        team1Overs: m.team1Overs,
        team2Runs: m.team2Runs,
        team2Wickets: m.team2Wickets,
        team2Overs: m.team2Overs,
        team1Score: m.team1Score,
        team2Score: m.team2Score,
      },
      create: {
        externalId: `ipl2025_match${m.matchNumber}`,
        ...m,
      }
    })
    createdMatches.push(match)
  }

  // Contests for upcoming/live matches
  const contestTypes = [
    { name: 'Mega Contest', type: 'mega', entryFee: 49, maxParticipants: 10000, prizePool: 400000, isGuaranteed: true, isFeatured: true },
    { name: 'Small League', type: 'small', entryFee: 19, maxParticipants: 500, prizePool: 8000, isGuaranteed: false, isFeatured: false },
    { name: 'Head to Head', type: 'head2head', entryFee: 49, maxParticipants: 2, prizePool: 90, isGuaranteed: true, isFeatured: false },
    { name: 'Practice Contest', type: 'practice', entryFee: 0, maxParticipants: 1000, prizePool: 0, isGuaranteed: false, isFeatured: false },
    { name: 'Winner Takes All', type: 'small', entryFee: 99, maxParticipants: 10, prizePool: 900, isGuaranteed: false, isFeatured: false },
  ]

  for (const match of createdMatches.filter(m => m.status !== 'completed')) {
    for (const ct of contestTypes) {
      await prisma.contest.create({
        data: {
          matchId: match.id,
          name: ct.name,
          contestType: ct.type,
          entryFee: ct.entryFee,
          maxParticipants: ct.maxParticipants,
          totalPrizePool: ct.prizePool,
          prizeBreakdown: JSON.stringify([
            { rank: 1, prize: Math.floor(ct.prizePool * 0.4) },
            { rank: 2, prize: Math.floor(ct.prizePool * 0.2) },
            { rank: 3, prize: Math.floor(ct.prizePool * 0.1) },
          ]),
          status: match.status === 'live' ? 'live' : 'open',
          startTime: match.startTime,
          isGuaranteed: ct.isGuaranteed,
          isFeatured: ct.isFeatured,
          currentParticipants: Math.floor(Math.random() * ct.maxParticipants * 0.7),
        }
      })
    }
  }

  // Sample trades and bets for demo users
  const liveMatch = createdMatches.find(m => m.status === 'live')
  if (liveMatch && users.length > 0) {
    for (const user of users.slice(0, 3)) {
      await prisma.trade.create({
        data: {
          userId: user.id,
          matchId: liveMatch.id,
          tradeType: 'buy_runs',
          prediction: 'team2_win',
          amount: 500,
          odds: 2.80,
          potentialWin: 1400,
          status: 'active',
        }
      })

      await prisma.bet.create({
        data: {
          userId: user.id,
          matchId: liveMatch.id,
          betCategory: 'match_winner',
          betType: 'team_win',
          betValue: 'KKR',
          amount: 200,
          odds: 2.80,
          potentialWin: 560,
          status: 'active',
        }
      })

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'deposit',
          amount: user.balance,
          balance: user.balance,
          description: 'Initial deposit',
          status: 'completed',
        }
      })
    }
  }

  console.log('✅ Database seeded successfully!')
  console.log(`👤 Admin: admin@ipltrading.com / Admin@123456`)
  console.log(`👤 Demo User: rahul@demo.com / Demo@12345`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
