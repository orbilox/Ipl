'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { ArrowDownLeft, ArrowUpRight, Clock, Copy, CheckCircle, XCircle, Coins } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn, formatTokens, formatDateTime } from '@/lib/utils'
import TopBar from '@/components/layout/TopBar'

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000]

export default function WalletPage() {
  const { data: session, update } = useSession()
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit')

  return (
    <>
      <TopBar />
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-white mb-2">Token Wallet</h1>

        {/* Token Balance */}
        <div className="card p-5 mb-6 bg-gradient-to-r from-orange-500/10 to-blue-500/10 border-orange-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-4 h-4 text-orange-400" />
            <div className="text-gray-400 text-sm">Token Balance</div>
          </div>
          <div className="font-display font-black text-4xl text-white">{formatTokens(session?.user?.balance || 0)}</div>
          <div className="text-gray-500 text-xs mt-1">1 Token = ₹1 · Tokens never expire</div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900/50 p-1 rounded-xl">
          {[
            { id: 'deposit', label: 'Buy Tokens', icon: ArrowDownLeft },
            { id: 'withdraw', label: 'Redeem', icon: ArrowUpRight },
            { id: 'history', label: 'History', icon: Clock },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white')}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'deposit' && <BuyTokensFlow />}
        {activeTab === 'withdraw' && <RedeemFlow balance={session?.user?.balance || 0} onSuccess={() => update()} />}
        {activeTab === 'history' && <HistoryTab />}
      </div>
    </>
  )
}

// ── Buy Tokens Flow ───────────────────────────────────────────────────────────

function BuyTokensFlow() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [amount, setAmount] = useState('')
  const [utrNumber, setUtrNumber] = useState('')
  const [screenshotUrl, setScreenshotUrl] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const { data: settingsData } = useQuery({
    queryKey: ['payment-settings'],
    queryFn: () => fetch('/api/admin/payment-settings').then(r => r.json()),
  })
  const s = settingsData?.settings || {}

  const submitMutation = useMutation({
    mutationFn: () => fetch('/api/wallet/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(amount), utrNumber, screenshotUrl, method: 'upi' }),
    }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      setStep(3)
    },
    onError: () => toast.error('Submission failed'),
  })

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(key)
    toast.success('Copied!')
    setTimeout(() => setCopied(null), 2000)
  }

  // Step 1 — Choose token amount
  if (step === 1) return (
    <div className="card p-5">
      <h3 className="font-semibold text-white mb-1">Step 1 of 2 — Choose Token Amount</h3>
      <p className="text-gray-500 text-xs mb-4">1 Token = ₹1 · Pay via UPI or bank transfer</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_AMOUNTS.map(a => (
          <button key={a} onClick={() => setAmount(String(a))}
            className={cn('px-4 py-2 rounded-xl border text-sm font-medium transition-all',
              amount === String(a) ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-700 text-gray-300 hover:border-orange-500')}>
            🪙 {a >= 1000 ? `${a / 1000}K` : a}
          </button>
        ))}
      </div>
      <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
        placeholder="Enter token amount" className="input mb-2" min={100} />
      <div className="text-xs text-gray-500 mb-5">Minimum 100 · Maximum 1,00,000 tokens</div>
      <button onClick={() => {
        if (!amount || parseFloat(amount) < 100) { toast.error('Minimum is 100 tokens'); return }
        setStep(2)
      }} className="btn-primary w-full">Continue to Payment →</button>
    </div>
  )

  // Step 2 — Pay + enter UTR
  if (step === 2) return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">
            Buy <span className="text-orange-400">🪙 {parseInt(amount).toLocaleString('en-IN')} Tokens</span>
          </h3>
          <button onClick={() => setStep(1)} className="text-xs text-gray-500 hover:text-white">← Change</button>
        </div>

        <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3 mb-4 text-sm text-orange-300">
          Pay exactly <strong>₹{parseInt(amount).toLocaleString('en-IN')}</strong> via UPI or bank transfer below. You will receive <strong>🪙 {parseInt(amount).toLocaleString('en-IN')} Tokens</strong> after admin verification.
        </div>

        {/* QR Code */}
        {s.payment_qr_url ? (
          <div className="flex justify-center mb-5">
            <div className="bg-white p-3 rounded-2xl shadow-lg">
              <img src={s.payment_qr_url} alt="Scan to Pay" className="w-52 h-52 object-contain" />
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-8 text-center text-gray-500 text-sm mb-5">
            QR Code not configured — contact admin
          </div>
        )}

        {/* UPI ID */}
        {s.payment_upi_id && (
          <div className="bg-gray-900 rounded-xl p-4 mb-3">
            <div className="text-xs text-gray-400 mb-1">UPI ID</div>
            <div className="flex items-center justify-between">
              <span className="text-white font-mono font-bold text-lg">{s.payment_upi_id}</span>
              <button onClick={() => copy(s.payment_upi_id, 'upi')}
                className="flex items-center gap-1 bg-orange-500/10 text-orange-400 px-3 py-1.5 rounded-lg text-xs">
                {copied === 'upi' ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'upi' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* Bank Details */}
        {s.payment_account_number && (
          <div className="bg-gray-900 rounded-xl p-4 mb-3">
            <div className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wide">Bank Transfer</div>
            <div className="space-y-2.5">
              {[
                { label: 'Account Name', value: s.payment_account_name, key: 'name' },
                { label: 'Account Number', value: s.payment_account_number, key: 'acc' },
                { label: 'IFSC Code', value: s.payment_ifsc, key: 'ifsc' },
                { label: 'Bank', value: s.payment_bank_name, key: 'bank' },
              ].filter(i => i.value).map(({ label, value, key }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">{label}</div>
                    <div className="text-white text-sm font-mono">{value}</div>
                  </div>
                  <button onClick={() => copy(value, key)} className="text-orange-400 p-1">
                    {copied === key ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {s.payment_note && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-400/90">
            ℹ️ {s.payment_note}
          </div>
        )}
      </div>

      {/* UTR Entry */}
      <div className="card p-5">
        <h3 className="font-semibold text-white mb-1">Step 2 of 2 — Confirm Payment</h3>
        <p className="text-gray-500 text-xs mb-4">After paying, enter your transaction details below</p>

        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-1 block">UTR / Transaction ID <span className="text-red-400">*</span></label>
          <input type="text" value={utrNumber} onChange={e => setUtrNumber(e.target.value)}
            placeholder="e.g. 425123456789" className="input" />
          <div className="text-xs text-gray-500 mt-1">Find in UPI app → Transaction history → UTR number</div>
        </div>

        <div className="mb-5">
          <label className="text-sm text-gray-400 mb-1 block">Payment Screenshot (optional)</label>
          <input type="text" value={screenshotUrl} onChange={e => setScreenshotUrl(e.target.value)}
            placeholder="Paste image/drive link" className="input" />
          <div className="text-xs text-gray-500 mt-1">Upload to Google Drive → right click → copy link</div>
        </div>

        <button onClick={() => {
          if (!utrNumber || utrNumber.trim().length < 6) { toast.error('Enter a valid UTR / Transaction ID'); return }
          submitMutation.mutate()
        }} disabled={submitMutation.isPending} className="btn-primary w-full text-base py-3">
          {submitMutation.isPending ? 'Submitting...' : '✓ Submit for Verification'}
        </button>
      </div>
    </div>
  )

  // Step 3 — Success
  return (
    <div className="card p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-10 h-10 text-green-400" />
      </div>
      <h3 className="font-bold text-white text-xl mb-2">Request Submitted!</h3>
      <p className="text-gray-400 text-sm mb-1">
        🪙 {parseInt(amount).toLocaleString('en-IN')} tokens purchase is under review
      </p>
      <p className="text-gray-500 text-xs mb-2">UTR: <span className="text-white font-mono">{utrNumber}</span></p>
      <p className="text-gray-500 text-xs mb-8">Admin will verify and credit your tokens within 30 minutes.</p>
      <button onClick={() => { setStep(1); setAmount(''); setUtrNumber(''); setScreenshotUrl('') }}
        className="btn-secondary w-full">Buy More Tokens</button>
    </div>
  )
}

// ── Redeem Flow ───────────────────────────────────────────────────────────────

function RedeemFlow({ balance, onSuccess }: { balance: number; onSuccess: () => void }) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<'upi' | 'bank'>('upi')
  const [upiId, setUpiId] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifsc, setIfsc] = useState('')
  const [bankName, setBankName] = useState('')

  const mutation = useMutation({
    mutationFn: () => fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parseFloat(amount), method,
        accountDetails: method === 'upi' ? { upiId } : { accountName, accountNumber, ifsc, bankName },
      }),
    }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success('Redemption request submitted!')
      setAmount('')
      onSuccess()
    },
  })

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-white mb-1">Redeem Tokens</h3>
      <p className="text-gray-500 text-xs mb-4">Convert tokens to real money · 1 Token = ₹1 · Admin approval required</p>

      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-1 block">Token Amount</label>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="Min 200 tokens" className="input" />
        <div className="flex gap-2 mt-2">
          {[500, 1000, 5000].map(a => (
            <button key={a} onClick={() => setAmount(String(Math.min(a, balance)))}
              className="flex-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 rounded-lg">
              🪙 {a >= 1000 ? `${a / 1000}K` : a}
            </button>
          ))}
          <button onClick={() => setAmount(String(Math.floor(balance)))}
            className="flex-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 rounded-lg">All</button>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">Payout Method</label>
        <div className="grid grid-cols-2 gap-2">
          {(['upi', 'bank'] as const).map(m => (
            <button key={m} onClick={() => setMethod(m)}
              className={cn('py-2.5 rounded-xl border text-sm font-medium transition-all',
                method === m ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-gray-800 text-gray-400 hover:border-gray-600')}>
              {m === 'upi' ? '📱 UPI' : '🏦 Bank Transfer'}
            </button>
          ))}
        </div>
      </div>

      {method === 'upi' ? (
        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-1 block">Your UPI ID</label>
          <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@paytm" className="input" />
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {[
            { label: 'Account Holder Name', value: accountName, set: setAccountName, ph: 'Full name' },
            { label: 'Account Number', value: accountNumber, set: setAccountNumber, ph: '00001234567890' },
            { label: 'IFSC Code', value: ifsc, set: setIfsc, ph: 'SBIN0001234' },
            { label: 'Bank Name', value: bankName, set: setBankName, ph: 'State Bank of India' },
          ].map(({ label, value, set, ph }) => (
            <div key={label}>
              <label className="text-xs text-gray-400 mb-1 block">{label}</label>
              <input type="text" value={value} onChange={e => set(e.target.value)} placeholder={ph} className="input text-sm py-2.5" />
            </div>
          ))}
        </div>
      )}

      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-400/80 mb-4">
        ⚠️ Tokens will be held until admin approves. Rejected requests are automatically refunded.
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-500">Available: {formatTokens(balance)}</span>
        {amount && parseFloat(amount) > 0 && (
          <span className="text-xs text-green-400">You receive: ₹{parseFloat(amount).toLocaleString('en-IN')}</span>
        )}
      </div>

      <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary w-full py-3">
        {mutation.isPending ? 'Submitting...' : 'Request Redemption'}
      </button>
    </div>
  )
}

// ── History ───────────────────────────────────────────────────────────────────

function HistoryTab() {
  const { data: depData } = useQuery({ queryKey: ['my-deposits'], queryFn: () => fetch('/api/wallet/deposit').then(r => r.json()) })
  const { data: wdData } = useQuery({ queryKey: ['my-withdrawals'], queryFn: () => fetch('/api/wallet/withdraw').then(r => r.json()) })

  const all = [
    ...(depData?.deposits || []).map((d: any) => ({ ...d, _type: 'deposit' })),
    ...(wdData?.withdrawals || []).map((w: any) => ({ ...w, _type: 'withdrawal' })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (all.length === 0) return <div className="card p-10 text-center text-gray-500">No transactions yet</div>

  return (
    <div className="space-y-3">
      {all.map((item: any) => (
        <div key={item.id} className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              {item._type === 'deposit'
                ? <ArrowDownLeft className="w-4 h-4 text-green-400" />
                : <ArrowUpRight className="w-4 h-4 text-red-400" />}
              <span className="text-white font-medium text-sm">
                {item._type === 'deposit' ? 'Token Purchase' : 'Token Redemption'}
              </span>
            </div>
            <span className={cn('font-bold text-sm', item._type === 'deposit' ? 'text-green-400' : 'text-red-400')}>
              {item._type === 'deposit' ? '+' : '-'}{formatTokens(item.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs">{formatDateTime(item.createdAt)}</span>
            <StatusBadge status={item.status} />
          </div>
          {item.utrNumber && <div className="text-xs text-gray-600 mt-1.5 font-mono">UTR: {item.utrNumber}</div>}
          {item.adminNote && (
            <div className="text-xs text-yellow-400/80 bg-yellow-500/5 rounded-lg p-2 mt-2">
              Note: {item.adminNote}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: typeof Clock; label: string }> = {
    pending:   { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', icon: Clock, label: 'Pending' },
    approved:  { color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: CheckCircle, label: 'Approved' },
    rejected:  { color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: XCircle, label: 'Rejected' },
    completed: { color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: CheckCircle, label: 'Completed' },
  }
  const s = map[status] || map.pending
  return (
    <span className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium', s.color)}>
      <s.icon className="w-3 h-3" />{s.label}
    </span>
  )
}
