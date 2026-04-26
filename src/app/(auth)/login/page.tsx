'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Trophy, Mail, Lock, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Please fill all fields')
      return
    }

    setLoading(true)
    try {
      const res = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      if (res?.error) {
        toast.error('Invalid email or password')
      } else {
        const session = await getSession()
        const role = session?.user?.role
        if (role === 'admin' || role === 'superadmin') {
          toast.success('Welcome, Admin! 🔐')
          router.push('/admin')
        } else {
          toast.success('Welcome back! 🏏')
          router.push('/dashboard')
        }
        router.refresh()
      }
    } catch {
      toast.error('Login failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(type: 'user' | 'admin') {
    if (type === 'user') {
      setForm({ email: 'rahul@demo.com', password: 'Demo@12345' })
    } else {
      setForm({ email: 'admin@ipltrading.com', password: 'Admin@123456' })
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="card p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400 text-sm">Sign in to your IPL Trading account</p>
        </div>

        {/* Demo buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => fillDemo('user')} className="btn-ghost text-xs text-center py-2 border border-gray-700 rounded-lg">
            👤 Demo User
          </button>
          <button onClick={() => fillDemo('admin')} className="btn-ghost text-xs text-center py-2 border border-gray-700 rounded-lg">
            🔐 Demo Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="Enter your email"
                className="input pl-10"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Enter your password"
                className="input pl-10 pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
              <input type="checkbox" className="rounded" />
              Remember me
            </label>
            <a href="#" className="text-orange-400 hover:text-orange-300">Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          New to IPL Trading?{' '}
          <Link href="/register" className="text-orange-400 font-medium hover:text-orange-300">
            Create Account & Get 🪙 50 Tokens Free
          </Link>
        </p>
      </div>
    </div>
  )
}
