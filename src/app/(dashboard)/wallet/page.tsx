'use client'

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import TopBar from '@/components/layout/TopBar'
import { Wallet, TrendingUp, TrendingDown, Plus, ArrowDown, ArrowUpRight, Loader2, CreditCard, Smartphone, Building2, CheckCircle } from 'lucide-react'
import { cn, formatCurrency, formatDateTime, timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

const DEPOSIT_AMOUNTS = [100, 200, 500, 1000, 2000, 5000]
const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: Smartphone, desc: 'Instant payment', color: 'text-green-400' },
  { id: 'card', label: 'Card', icon: CreditCard, desc: 'Credit/Debit', color: 'text-blue-400' },
  { id: 'netbanking', label: 'Net Banking', icon: Building2, desc: 'All banks', color: 'text-purple-400' },
]

export default function WalletPage() {
  const { data: session, update } = useSession()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit')
  const [depositAmount, setDepositAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState('upi')
  const [upiId, setUpiId] = useState('')
  const [success, setSuccess] = useState(false)

  const { data: txData } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => fetch('/api/wallet/transactions').then(r => r.json()),
    refetchInterval: 30000,
  })

  const depositMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/wallet/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
    onSuccess: async (data) => {
      if (data.error) { toast.error(data.error); return }
      setSuccess(true)
      toast.success(`₹${depositAmount} added to your wallet! 💰`)
      setDepositAmount('')
      await update({ balance: data.newBalance })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setTimeout(() => setSuccess(false), 3000)
    }
  })

  const withdrawMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
    onSuccess: async (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success('Withdrawal request submitted!')
      setWithdrawAmount('')
      setUpiId('')
      await update({ balance: data.newBalance })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    }
  })

  function handleDeposit() {
    const amount = parseFloat(depositAmount)
    if (!amount || amount < 100) { toast.error('Minimum deposit is ₹100'); return }
    depositMutation.mutate({ amount, method: paymentMethod })
  }

  function handleWithdraw() {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount < 200) { toast.error('Minimum withdrawal is ₹200'); return }
    if (amount > (session?.user?.balance || 0)) { toast.error('Insufficient balance'); return }
    if (!upiId) { toast.error('Enter UPI ID or bank details'); return }
    withdrawMutation.mutate({
      amount,
      method: withdrawMethod,
      accountDetails: { upiId }
    })
  }

  const stats = txData?.summary || {}
  const transactions = txData?.transactions || []

  return (
    <>
      <TopBar title="Wallet" />
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        {/* Balance Card */}
        <div className="card p-6 mb-6 bg-gradient-to-br from-orange-500/10 to-red-500/5 border-orange-500/20 glow-orange">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-orange-400" />
              <span className="text-gray-400 text-sm">Total Balance</span>
            </div>
            <span className="badge bg-green-500/10 text-green-400 text-xs">Available</span>
          </div>
          <div className="font-display font-black text-4xl text-white mb-4">
            {formatCurrency(session?.user?.balance || 0)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Deposited', value: stats.totalDeposited || 0, icon: ArrowDown, color: 'text-green-400' },
              { label: 'Total Won', value: stats.totalWon || 0, icon: TrendingUp, color: 'text-blue-400' },
              { label: 'Total Withdrawn', value: stats.totalWithdrawn || 0, icon: ArrowUpRight, color: 'text-orange-400' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <s.icon className={cn('w-4 h-4 mx-auto mb-1', s.color)} />
                <div className={cn('font-bold text-sm', s.color)}>{formatCurrency(s.value)}</div>
                <div className="text-gray-500 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900/50 p-1 rounded-xl">
          {[
            { id: 'deposit', label: 'Add Money', icon: Plus },
            { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight },
            { id: 'history', label: 'History', icon: TrendingDown },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Deposit */}
        {activeTab === 'deposit' && (
          <div className="space-y-5">
            {success && (
              <div className="card p-4 bg-green-500/10 border-green-500/20 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">Money added successfully!</span>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Select Amount</label>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {DEPOSIT_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setDepositAmount(String(amt))}
                    className={cn(
                      'py-3 rounded-xl border text-sm font-semibold transition-all',
                      depositAmount === String(amt)
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                        : 'border-gray-700 bg-gray-900/50 text-gray-300 hover:border-gray-600'
                    )}
                  >
                    ₹{amt >= 1000 ? `${amt/1000}K` : amt}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                placeholder="Or enter custom amount (min ₹100)"
                className="input"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                {PAYMENT_METHODS.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={cn(
                      'p-4 rounded-xl border text-center transition-all',
                      paymentMethod === method.id
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                    )}
                  >
                    <method.icon className={cn('w-6 h-6 mx-auto mb-1', method.color)} />
                    <div className="text-white text-xs font-medium">{method.label}</div>
                    <div className="text-gray-500 text-xs">{method.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {depositAmount && parseFloat(depositAmount) >= 100 && (
              <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-white font-medium">{formatCurrency(parseFloat(depositAmount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Processing Fee</span>
                  <span className="text-green-400">FREE</span>
                </div>
                <div className="border-t border-gray-800 pt-2 flex justify-between">
                  <span className="text-white font-medium">Total to Pay</span>
                  <span className="text-white font-bold">{formatCurrency(parseFloat(depositAmount))}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleDeposit}
              disabled={depositMutation.isPending || !depositAmount}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
            >
              {depositMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {depositMutation.isPending ? 'Processing...' : `Add ${depositAmount ? formatCurrency(parseFloat(depositAmount)) : 'Money'}`}
            </button>

            <p className="text-center text-gray-500 text-xs">
              🔒 Secure payment · 100% Safe · Instant credit
            </p>
          </div>
        )}

        {/* Withdraw */}
        {activeTab === 'withdraw' && (
          <div className="space-y-5">
            <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl text-sm">
              <p className="text-yellow-400 font-medium mb-1">Withdrawal Policy</p>
              <p className="text-gray-400">Min ₹200 · Processed in 24 hours · KYC verification required</p>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Withdrawal Method</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'upi', label: 'UPI', icon: Smartphone },
                  { id: 'bank', label: 'Bank', icon: Building2 },
                  { id: 'paytm', label: 'Paytm', icon: Wallet },
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setWithdrawMethod(method.id)}
                    className={cn(
                      'p-3 rounded-xl border text-center transition-all',
                      withdrawMethod === method.id
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-gray-700 bg-gray-900/50'
                    )}
                  >
                    <method.icon className="w-5 h-5 mx-auto mb-1 text-gray-300" />
                    <div className="text-xs text-gray-300">{method.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">UPI ID / Account Details</label>
              <input
                type="text"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder={withdrawMethod === 'upi' ? 'yourname@upi' : 'Account number'}
                className="input"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Amount (₹)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                placeholder="Min ₹200"
                className="input"
                min={200}
                max={session?.user?.balance || 0}
              />
              <div className="flex gap-2 mt-2">
                {[200, 500, 1000, 5000].map(amt => (
                  <button key={amt}
                    onClick={() => setWithdrawAmount(String(Math.min(amt, session?.user?.balance || 0)))}
                    className="flex-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 rounded-lg transition-colors">
                    ₹{amt >= 1000 ? `${amt/1000}K` : amt}
                  </button>
                ))}
                <button
                  onClick={() => setWithdrawAmount(String(session?.user?.balance || 0))}
                  className="flex-1 text-xs bg-gray-800 hover:bg-gray-700 text-orange-400 py-1.5 rounded-lg transition-colors">
                  MAX
                </button>
              </div>
            </div>

            <button
              onClick={handleWithdraw}
              disabled={withdrawMutation.isPending || !withdrawAmount || !upiId}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4"
            >
              {withdrawMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {withdrawMutation.isPending ? 'Processing...' : 'Request Withdrawal'}
            </button>
          </div>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <div>
            {transactions.length === 0 ? (
              <div className="text-center py-20 text-gray-500">No transactions yet</div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center gap-4 p-4 card">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg',
                      ['deposit', 'bonus', 'trade_win', 'bet_win', 'contest_win', 'refund'].includes(tx.type)
                        ? 'bg-green-500/10' : 'bg-red-500/10'
                    )}>
                      {tx.type === 'deposit' ? '💳' :
                       tx.type === 'withdrawal' ? '💸' :
                       tx.type === 'trade_win' || tx.type === 'bet_win' ? '🏆' :
                       tx.type === 'bonus' ? '🎁' :
                       tx.type === 'contest_win' ? '🥇' : '🎯'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{tx.description}</div>
                      <div className="text-gray-500 text-xs">{timeAgo(tx.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className={cn('font-bold text-sm',
                        tx.amount > 0 ? 'text-green-400' : 'text-red-400'
                      )}>
                        {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                      </div>
                      <div className="text-gray-500 text-xs">{formatCurrency(tx.balance)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
