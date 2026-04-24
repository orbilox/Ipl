import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'IPL Trading - Live Cricket Trading & Fantasy',
  description: 'Trade on live IPL matches, bet on cricket, join fantasy contests and win real money. India\'s premier cricket trading platform.',
  keywords: 'IPL trading, cricket betting, fantasy cricket, live match trading, IPL 2025',
  authors: [{ name: 'IPL Trading' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'IPL Trading - Live Cricket Trading Platform',
    description: 'Trade on live IPL matches and win real money',
    type: 'website',
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f0f1a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1a2e',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: '#fff' }
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' }
              }
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
