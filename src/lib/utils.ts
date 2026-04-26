import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistance } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatTokens(amount: number): string {
  return `🪙 ${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(Math.abs(amount)))}`
}

export function formatNumber(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy, hh:mm a')
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'hh:mm a')
}

export function timeAgo(date: string | Date): string {
  return formatDistance(new Date(date), new Date(), { addSuffix: true })
}

export function getMatchTimeStatus(startTime: string, status: string): string {
  if (status === 'live') return 'LIVE'
  if (status === 'completed') return 'Completed'
  if (status === 'cancelled') return 'Cancelled'
  const diff = new Date(startTime).getTime() - Date.now()
  if (diff < 0) return 'Starting soon'
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `Starts in ${days}d`
  }
  if (hours > 0) return `Starts in ${hours}h ${mins}m`
  return `Starts in ${mins}m`
}

export function calculatePotentialWin(amount: number, odds: number): number {
  return Math.round(amount * odds * 100) / 100
}

export function calculateProfit(amount: number, odds: number): number {
  return Math.round((amount * odds - amount) * 100) / 100
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    live: 'text-green-400 bg-green-400/10',
    upcoming: 'text-blue-400 bg-blue-400/10',
    completed: 'text-gray-400 bg-gray-400/10',
    cancelled: 'text-red-400 bg-red-400/10',
    won: 'text-green-400 bg-green-400/10',
    lost: 'text-red-400 bg-red-400/10',
    active: 'text-yellow-400 bg-yellow-400/10',
    pending: 'text-orange-400 bg-orange-400/10',
    settled: 'text-gray-400 bg-gray-400/10',
    open: 'text-blue-400 bg-blue-400/10',
  }
  return colors[status] || 'text-gray-400 bg-gray-400/10'
}

export function getTeamColor(teamShort: string): string {
  const colors: Record<string, string> = {
    MI: '#004C8A',
    CSK: '#FFFF00',
    RCB: '#E30613',
    KKR: '#3A225D',
    DC: '#00008B',
    SRH: '#FF822A',
    RR: '#EA1A85',
    PBKS: '#ED1B24',
    LSG: '#A72056',
    GT: '#1D4E89',
  }
  return colors[teamShort] || '#6B7280'
}

export function generateReferralCode(): string {
  return 'IPL' + Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  return `${user.substring(0, 2)}***@${domain}`
}

export function maskPhone(phone: string): string {
  return `${phone.substring(0, 2)}****${phone.substring(phone.length - 4)}`
}

export function getOddsImpliedProbability(odds: number): number {
  return Math.round((1 / odds) * 100)
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}
