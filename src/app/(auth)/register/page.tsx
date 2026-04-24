'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Trophy, Mail, Lock, User, Phone, Gift, Loader2, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', referralCode: '', agreed: false
  })

  function updateForm(key: string, value: string | boolean) {
    setForm(p => ({ ...p, [key]: value }))
  }

  function validateStep1() {
    if (!form.name.trim() || form.name.length < 2) { toast.error('Enter your full name'); return false }
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) { toast.error('Enter valid email'); return false }
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) { toast.error('Enter valid 10-digit Indian phone number'); return false }
    return true
  }

  function validateStep2() {
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return false }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      toast.error('Password must have uppercase, lowercase and number')
      return false
    }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return false }
    if (!form.agreed) { toast.error('Please agree to terms'); return false }
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateStep2()) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email.toLowerCase(),
          phone: form.phone || undefined,
          password: form.password,
          referralCode: form.referralCode || undefined,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')

      toast.success('Account created! Get your ₹50 bonus 🎉')
      router.push('/login')
    } catch (err: any) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = () => {
    let score = 0
    if (form.password.length >= 8) score++
    if (/[A-Z]/.test(form.password)) score++
    if (/[0-9]/.test(form.password)) score++
    if (/[^A-Za-z0-9]/.test(form.password)) score++
    return score
  }

  const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strength = passwordStrength()

  return (
    <div className="w-full max-w-md">
      <div className="card p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl text-white mb-1">Create Account</h1>
          <p className="text-gray-400 text-sm">Join 2.5 lakh+ traders & get ₹50 free</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all ${s <= step ? 'bg-orange-500' : 'bg-gray-800'}`} />
            </div>
          ))}
        </div>

        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => updateForm('name', e.target.value)}
                  placeholder="Enter your full name"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => updateForm('email', e.target.value)}
                  placeholder="Enter your email"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Phone <span className="text-gray-500 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <div className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+91</div>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => updateForm('phone', e.target.value)}
                  placeholder="10-digit mobile number"
                  className="input pl-16"
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Referral Code <span className="text-gray-500 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={form.referralCode}
                  onChange={e => updateForm('referralCode', e.target.value.toUpperCase())}
                  placeholder="Enter referral code for extra bonus"
                  className="input pl-10 uppercase"
                />
              </div>
              {form.referralCode && (
                <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Extra ₹50 bonus with valid referral!
                </p>
              )}
            </div>

            <button
              onClick={() => validateStep1() && setStep(2)}
              className="btn-primary w-full"
            >
              Continue
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Set Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => updateForm('password', e.target.value)}
                  placeholder="Min 8 chars, uppercase, number"
                  className="input pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`flex-1 h-1 rounded-full ${i <= strength ? strengthColors[strength] : 'bg-gray-800'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Strength: <span className="text-gray-300">{strengthLabels[strength]}</span></p>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => updateForm('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className="input pl-10"
                />
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">Passwords don&apos;t match</p>
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.agreed}
                onChange={e => updateForm('agreed', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded"
              />
              <span className="text-gray-400 text-sm">
                I agree to the{' '}
                <a href="#" className="text-orange-400 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-orange-400 hover:underline">Privacy Policy</a>.
                I am 18+ years old.
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                Back
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-orange-400 font-medium hover:text-orange-300">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
