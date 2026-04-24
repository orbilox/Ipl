export interface User {
  id: string
  email: string
  name: string
  phone?: string
  avatar?: string
  role: 'user' | 'admin' | 'superadmin'
  isVerified: boolean
  isActive: boolean
  kycStatus: 'pending' | 'verified' | 'rejected'
  balance: number
  bonusBalance: number
  totalDeposited: number
  totalWithdrawn: number
  totalWon: number
  totalLost: number
  referralCode: string
  createdAt: string
}

export interface Match {
  id: string
  externalId?: string
  team1: string
  team2: string
  team1Short: string
  team2Short: string
  team1Logo?: string
  team2Logo?: string
  venue: string
  city: string
  startTime: string
  status: 'upcoming' | 'live' | 'completed' | 'cancelled'
  matchType: string
  series: string
  matchNumber?: number
  currentInnings: number
  team1Score?: string
  team2Score?: string
  team1Runs?: number
  team1Wickets?: number
  team1Overs?: string
  team2Runs?: number
  team2Wickets?: number
  team2Overs?: string
  currentBatsmen?: string
  currentBowler?: string
  lastBall?: string
  requiredRuns?: number
  requiredOvers?: string
  tossWinner?: string
  tossDecision?: string
  result?: string
  winnerTeam?: string
  team1Odds: number
  team2Odds: number
  drawOdds?: number
  isLocked: boolean
  featuredMatch: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    trades: number
    bets: number
    contests: number
  }
}

export interface Trade {
  id: string
  userId: string
  matchId: string
  tradeType: string
  prediction: string
  amount: number
  odds: number
  potentialWin: number
  status: 'active' | 'won' | 'lost' | 'cancelled' | 'settled'
  result?: string
  pnl: number
  settledAt?: string
  createdAt: string
  match?: Match
}

export interface Bet {
  id: string
  userId: string
  matchId: string
  betCategory: string
  betType: string
  betValue: string
  amount: number
  odds: number
  potentialWin: number
  status: 'pending' | 'active' | 'won' | 'lost' | 'cancelled' | 'refunded'
  result?: string
  pnl: number
  settledAt?: string
  createdAt: string
  match?: Match
}

export interface Contest {
  id: string
  matchId: string
  name: string
  description?: string
  contestType: 'mega' | 'small' | 'head2head' | 'practice'
  entryFee: number
  maxParticipants: number
  currentParticipants: number
  totalPrizePool: number
  prizeBreakdown: PrizeBreakdown[]
  status: 'upcoming' | 'open' | 'locked' | 'live' | 'completed' | 'cancelled'
  startTime: string
  endTime?: string
  isGuaranteed: boolean
  isFeatured: boolean
  createdAt: string
  match?: Match
  entries?: ContestEntry[]
}

export interface PrizeBreakdown {
  rank: number
  prize: number
}

export interface ContestEntry {
  id: string
  contestId: string
  userId: string
  teamName: string
  players: string[]
  captain: string
  viceCaptain: string
  score: number
  rank?: number
  prize: number
  status: string
  createdAt: string
  user?: User
  contest?: Contest
}

export interface Transaction {
  id: string
  userId: string
  type: string
  amount: number
  balance: number
  description: string
  referenceId?: string
  status: 'pending' | 'completed' | 'failed' | 'reversed'
  metadata?: string
  createdAt: string
}

export interface Player {
  id: string
  externalId?: string
  name: string
  fullName?: string
  team: string
  role: 'batsman' | 'bowler' | 'allrounder' | 'wicketkeeper'
  nationality: string
  battingStyle?: string
  bowlingStyle?: string
  image?: string
  creditValue: number
  isActive: boolean
}

export interface PlayerStat {
  id: string
  playerId: string
  matchId: string
  runs?: number
  balls?: number
  fours?: number
  sixes?: number
  strikeRate?: number
  wickets?: number
  economy?: number
  oversBowled?: string
  catches?: number
  stumpings?: number
  fantasyPoints: number
  player?: Player
}

export interface Withdrawal {
  id: string
  userId: string
  amount: number
  method: string
  accountDetails: string
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  rejectionReason?: string
  processedAt?: string
  createdAt: string
  user?: User
}

export interface Deposit {
  id: string
  userId: string
  amount: number
  method: string
  gateway: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
  user?: User
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  link?: string
  createdAt: string
}

export interface BetOption {
  label: string
  value: string
  odds: number
  category: string
}

export interface TradeOption {
  label: string
  value: string
  type: string
  odds: number
  description: string
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalDeposits: number
  totalWithdrawals: number
  totalTrades: number
  activeTrades: number
  totalBets: number
  totalContests: number
  revenue: number
}
