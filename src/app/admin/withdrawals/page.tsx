'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Check, X, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react'
import { cn, formatCurrency, formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminWithdrawalsPage() {
  const [statusFilter, setStatusFilter] = useState('pending')
  const [actionModal, setActionModal] = useState<any>(null)
  const [adminNote, setAdminNote] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-withdrawals', statusFilter],
    queryFn: () => fetch(`/api/admin/withdrawals?status=${statusFilter}`).then(r => r.json()),
    refetchInterval: 15000,
  })

  const actionMutation = useMutation({
    mutationFn: ({ withdrawalId, action }: { withdrawalId: string; action: string }) =>
      fetch('/api/admin/withdrawals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId, action, adminNote }),
      }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success(data.message)
      setActionModal(null)
      setAdminNote('')
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] })
    },
    onError: () => toast.error('Action failed'),
  })

  const withdrawals = data?.withdrawals || []
  const pendingCount = withdrawals.filter((w: any) => w.status === 'pending').length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Withdrawal Requests</h1>
          {statusFilter === 'pending' && pendingCount > 0 && (
            <p className="text-orange-400 text-sm mt-0.5">{pendingCount} pending approval</p>
          )}
        </div>
        <button onClick={() => refetch()} className="btn-secondary text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6">
        {['pending', 'approved', 'rejected', 'all'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn('px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all',
              statusFilter === s ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white')}>
            {s}
          </button>
        ))}
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md">
            <h3 className={cn('font-bold text-lg mb-1', actionModal.action === 'approve' ? 'text-green-400' : 'text-red-400')}>
              {actionModal.action === 'approve' ? '✓ Approve Withdrawal' : '✕ Reject Withdrawal'}
            </h3>
            <p className="text-gray-400 text-sm mb-1">
              {actionModal.user?.name} — {formatCurrency(actionModal.amount)}
            </p>
            <p className="text-gray-500 text-xs mb-4">
              Method: {actionModal.method?.toUpperCase()} · {formatDateTime(actionModal.createdAt)}
            </p>

            {(() => {
              try {
                const details = JSON.parse(actionModal.accountDetails || '{}')
                return (
                  <div className="bg-gray-900/60 rounded-xl p-3 mb-4 space-y-1">
                    {details.upiId && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">UPI ID</span>
                        <span className="text-white font-mono">{details.upiId}</span>
                      </div>
                    )}
                    {details.accountNumber && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Account</span>
                          <span className="text-white font-mono">{details.accountNumber}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">IFSC</span>
                          <span className="text-white font-mono">{details.ifsc}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Name</span>
                          <span className="text-white">{details.accountName}</span>
                        </div>
                        {details.bankName && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Bank</span>
                            <span className="text-white">{details.bankName}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              } catch { return null }
            })()}

            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-1 block">
                {actionModal.action === 'approve' ? 'Note (optional)' : 'Rejection Reason'}
              </label>
              <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={2}
                placeholder={actionModal.action === 'approve' ? 'e.g. Transferred via NEFT' : 'e.g. Invalid account details'}
                className="input resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => actionMutation.mutate({ withdrawalId: actionModal.id, action: actionModal.action })}
                disabled={actionMutation.isPending}
                className={cn('flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all',
                  actionModal.action === 'approve'
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white')}>
                {actionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> :
                  actionModal.action === 'approve' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {actionModal.action === 'approve' ? 'Approve' : 'Reject & Refund'}
              </button>
              <button onClick={() => { setActionModal(null); setAdminNote('') }} className="btn-secondary text-sm py-2.5">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
      ) : withdrawals.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">No {statusFilter} withdrawals</div>
      ) : (
        <div className="space-y-4">
          {withdrawals.map((w: any) => {
            let details: any = {}
            try { details = JSON.parse(w.accountDetails || '{}') } catch {}
            return (
              <div key={w.id} className={cn('card p-5 border-l-4',
                w.status === 'pending' ? 'border-l-yellow-500' :
                w.status === 'approved' ? 'border-l-green-500' : 'border-l-red-500')}>

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold">{w.user?.name}</span>
                      <StatusBadge status={w.status} />
                    </div>
                    <div className="text-gray-400 text-xs">{w.user?.email}</div>
                    {w.user?.phone && <div className="text-gray-400 text-xs">{w.user?.phone}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold text-2xl text-white">{formatCurrency(w.amount)}</div>
                    <div className="text-gray-500 text-xs">{formatDateTime(w.createdAt)}</div>
                  </div>
                </div>

                <div className="bg-gray-900/60 rounded-xl p-3 mb-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Method</span>
                    <span className="text-white uppercase font-medium">{w.method}</span>
                  </div>
                  {details.upiId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">UPI ID</span>
                      <span className="text-white font-mono">{details.upiId}</span>
                    </div>
                  )}
                  {details.accountNumber && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Account No.</span>
                        <span className="text-white font-mono">{details.accountNumber}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">IFSC</span>
                        <span className="text-white font-mono">{details.ifsc}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Holder</span>
                        <span className="text-white">{details.accountName}</span>
                      </div>
                    </>
                  )}
                  {w.adminNote && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Admin Note</span>
                      <span className="text-yellow-400">{w.adminNote}</span>
                    </div>
                  )}
                </div>

                {w.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setActionModal({ ...w, action: 'approve' }); setAdminNote('') }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl text-sm font-medium transition-all">
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => { setActionModal({ ...w, action: 'reject' }); setAdminNote('') }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium transition-all">
                      <X className="w-4 h-4" /> Reject & Refund
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: typeof Clock }> = {
    pending:  { color: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20', icon: Clock },
    approved: { color: 'bg-green-400/10 text-green-400 border-green-400/20', icon: CheckCircle },
    rejected: { color: 'bg-red-400/10 text-red-400 border-red-400/20', icon: XCircle },
  }
  const s = map[status] || map.pending
  return (
    <span className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium capitalize', s.color)}>
      <s.icon className="w-3 h-3" />{status}
    </span>
  )
}
