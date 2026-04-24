import Link from 'next/link'
import { Trophy, TrendingUp, Shield, Zap, Users, Star, ChevronRight, PlayCircle, DollarSign, Target, Award } from 'lucide-react'

const stats = [
  { label: 'Active Users', value: '2.5L+', icon: Users },
  { label: 'Prize Pool', value: '₹10Cr+', icon: Trophy },
  { label: 'Matches Covered', value: '60+', icon: Target },
  { label: 'Total Payouts', value: '₹50Cr+', icon: DollarSign },
]

const features = [
  {
    icon: TrendingUp,
    title: 'Live Match Trading',
    description: 'Trade on real-time IPL match odds. Buy or sell your position as the match progresses. React to every ball.'
  },
  {
    icon: Target,
    title: 'Smart Betting',
    description: 'Place bets on match winner, top batsman, total runs, wickets and 20+ other markets with competitive odds.'
  },
  {
    icon: Trophy,
    title: 'Fantasy Contests',
    description: 'Create your dream team, join mega contests with crore prize pools and compete with lakhs of players.'
  },
  {
    icon: Zap,
    title: 'Instant Withdrawals',
    description: 'Win and withdraw instantly. UPI transfers processed in minutes. Your money, your control.'
  },
  {
    icon: Shield,
    title: '100% Secure',
    description: 'Bank-grade encryption, RNG certified games and responsible gaming tools to keep you safe.'
  },
  {
    icon: Award,
    title: 'Head to Head',
    description: 'Challenge a friend or random player to 1v1 contests. Winner takes all. Pure skill battle.'
  },
]

const howItWorks = [
  { step: '01', title: 'Register & Get Bonus', desc: 'Sign up and get ₹50 welcome bonus instantly' },
  { step: '02', title: 'Add Money', desc: 'Deposit using UPI, Net Banking or Cards' },
  { step: '03', title: 'Trade & Bet', desc: 'Pick your match and start trading or betting' },
  { step: '04', title: 'Win & Withdraw', desc: 'Win real money and withdraw instantly' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f0f1a] overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-white">IPL <span className="text-orange-400">Trading</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
            <Link href="#contests" className="hover:text-white transition-colors">Contests</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-4 py-2">
              Login
            </Link>
            <Link href="/register" className="btn-primary text-sm px-5 py-2.5">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-6">
            <div className="live-dot" />
            <span className="text-green-400 text-sm font-medium">IPL 2025 Live Now</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-7xl text-white mb-6 leading-tight">
            Trade Cricket.
            <br />
            <span className="text-gradient">Win Real Money.</span>
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            India&apos;s most exciting IPL trading platform. Trade live match odds, place smart bets,
            join fantasy contests and win crores in prize money.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register" className="btn-primary text-base px-8 py-4 flex items-center gap-2 w-full sm:w-auto justify-center">
              Start Trading Free
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="btn-secondary text-base px-8 py-4 flex items-center gap-2 w-full sm:w-auto justify-center">
              <PlayCircle className="w-5 h-5" />
              Watch Demo
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="card p-4 text-center">
                <div className="font-display font-bold text-2xl text-gradient-gold">{stat.value}</div>
                <div className="text-gray-400 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Match Ticker */}
      <div className="bg-[#16213e] border-y border-gray-800/50 py-3 overflow-hidden">
        <div className="flex items-center gap-2 px-4 mb-1">
          <div className="live-dot" />
          <span className="text-green-400 text-xs font-semibold">LIVE</span>
        </div>
        <div className="ticker-wrapper">
          <div className="animate-ticker inline-flex gap-12 text-sm text-gray-400">
            <span>🏏 RCB vs KKR — RCB: 187/5 (20.0) | KKR: 45/2 (6.2) — KKR need 143 in 82 balls</span>
            <span>📊 Trade: RCB 1.45x | KKR 2.80x</span>
            <span>🏆 Mega Contest: ₹40L Prize Pool — 8,234 Teams Joined</span>
            <span>💰 Top Winner Today: Rahul S. won ₹1,24,000</span>
            <span>🏏 MI vs CSK Tomorrow 7:30 PM — Pre-match trading open!</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4">
              Everything You Need to <span className="text-gradient">Win Big</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              A complete cricket trading ecosystem with real-time data, smart analytics and instant payouts.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card-hover p-6 group">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                  <f.icon className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="font-semibold text-white text-lg mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-[#16213e]/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4">
              Start in <span className="text-gradient">4 Simple Steps</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <div key={item.step} className="relative">
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-orange-500/50 to-transparent z-0" />
                )}
                <div className="card p-6 relative z-10">
                  <div className="font-display font-black text-4xl text-gradient-gold opacity-30 mb-3">{item.step}</div>
                  <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contest Showcase */}
      <section id="contests" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4">
              Massive Prize <span className="text-gradient">Contests</span>
            </h2>
            <p className="text-gray-400 text-lg">Join contests starting from ₹19. Win up to ₹1 Crore!</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            {[
              { name: 'Mega Contest', prize: '₹40 Lakhs', entry: '₹49', spots: '10,000', filled: 82, badge: '🔥 Featured', color: 'from-orange-500/20 to-red-500/10' },
              { name: 'Champion League', prize: '₹5 Lakhs', entry: '₹99', spots: '1,000', filled: 64, badge: '⚡ Hot', color: 'from-blue-500/20 to-purple-500/10' },
              { name: 'Head to Head', prize: '₹90', entry: '₹49', spots: '2', filled: 50, badge: '👊 1v1', color: 'from-green-500/20 to-teal-500/10' },
            ].map((contest) => (
              <div key={contest.name} className={`card p-6 bg-gradient-to-br ${contest.color} border border-white/5`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium bg-white/10 px-3 py-1 rounded-full">{contest.badge}</span>
                  <span className="text-xs text-gray-400">{contest.spots} spots</span>
                </div>
                <div className="font-display font-black text-3xl text-white mb-1">{contest.prize}</div>
                <div className="text-gray-400 text-sm mb-4">{contest.name}</div>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{contest.filled}% filled</span>
                    <span>Entry: {contest.entry}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                      style={{ width: `${contest.filled}%` }}
                    />
                  </div>
                </div>
                <Link href="/register" className="btn-primary w-full text-center text-sm py-2.5 block">
                  Join Contest
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card p-10 bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20 glow-orange">
            <h2 className="font-display font-black text-3xl sm:text-4xl text-white mb-4">
              Ready to Trade? <span className="text-gradient">Get ₹50 Free!</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Register now and get ₹50 welcome bonus to start your trading journey.
              No deposit required for the welcome bonus.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary text-base px-10 py-4">
                Create Free Account
              </Link>
              <Link href="/login" className="btn-secondary text-base px-10 py-4">
                Login to Trade
              </Link>
            </div>
            <p className="text-gray-500 text-xs mt-6">
              ✓ Instant registration  ✓ Secure payments  ✓ 24/7 support
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#16213e] border-t border-gray-800/50 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-bold text-white">IPL Trading</span>
              </div>
              <p className="text-gray-400 text-sm">India&apos;s premier cricket trading and fantasy platform.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Products</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/register" className="hover:text-white transition-colors">Live Trading</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Fantasy Contests</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Head to Head</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Leaderboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Responsible Gaming</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Follow Us</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Twitter/X</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Telegram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-xs">© 2025 IPL Trading. All rights reserved.</p>
            <p className="text-gray-600 text-xs">18+ | Play Responsibly | For entertainment purposes only</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
