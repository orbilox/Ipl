'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Swords, Trophy, Wallet, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/matches', label: 'Matches', icon: Swords },
  { href: '/contests', label: 'Contests', icon: Trophy },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/portfolio', label: 'Portfolio', icon: BarChart3 },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="mobile-nav lg:hidden">
      <div className="grid grid-cols-5 py-1">
        {mobileItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 py-2 px-2 transition-colors',
                active ? 'text-orange-400' : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <item.icon className={cn('w-5 h-5', active && 'scale-110 transition-transform')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
