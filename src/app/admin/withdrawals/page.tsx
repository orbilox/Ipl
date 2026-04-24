'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Loader2, Check, X } from 'lucide-react'
import { cn, formatCurrency, formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminWithdrawalsPage() {
  const [status, setStatus] = useState('pending')
  const [rejectReason, setRejectReason] = useState('')
  const [selectedId, setSelectedId] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-withdrawals', status],
    queryFn: () => fetch(`/api/admin/withdrawals?status=${status}`).then(r => r.json()),
    refetchInterval: 30000,
  })

  const actionMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/admin/withdrawals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success(data.message)
      setSelectedId('')
      setRejectReason('')
      refetch()
    }
  })

  const withdrawals = data?.withdrawals || []

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-white">Withdrawals</h1>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6">
        {['pending', 'processing', 'completed', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all',
              status === s ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Reject modal */}
      {selectedId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md">
            <h3 className="font-bold text-white mb-4">Reject Withdrawal</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (will be sent to user)"
              className="input mb-4 h-20 resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => actionMutation.mutate({ withdrawalId: selectedId, action: 'reject', rejectionReason: rejectReason })}
                disabled={actionMutation.isPending}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-4 py-2.5 text-sm flex items-center justify-center gap-2"
              >
                {actionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Reject & Refund
              </button>
              <button onClick={() => setSelectedId('')} className="btn-secondary text-sm py-2.5">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
      ) : withdrawals.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No {status} withdrawals</div>
      ) : (
        <div className="space-y-4">
          {withdrawals.map((w: any) => {
            const details = JSON.parse(w.accountDetails || '{}')
            return (
              <div key={w.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-white font-medium">{w.user?.name}</div>
                    <div className="text-gray-400 text-xs">{w.user?.email} · {w.user?.phone}</div>
                  </div>
                  <span className={cn('badge text-xs',
                    w.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                    w.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                    w.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                    'bg-blue-500/10 text-blue-400'
                  )}>
                    {w.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-gray-400 text-xs">Amount</div>
                    <div className="text-white font-bold text-lg">{formatCurrency(w.amount)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Method</div>
                    <div className="text-white">{w.method.toUpperCase()}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Requested</div>
                    <div className="text-gray-300 text-xs">{formatDateTime(w.createdAt)}</div>
                  </div>
                </div>

                {details.upiId && (
                  <div className="text-xs text-gray-400 mb-3">
                    UPI: <span className="text-white font-mono">{details.upiId}</span>
                  </div>
                )}

                {w.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => actionMutation.mutate({ withdrawalId: w.id, action: 'approve' })}
                      disabled={actionMutation.isPending}
                      className="btn-primary text-sm py-2 flex items-center gap-2 flex-1"
                    >
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => setSelectedId(w.id)}
                      className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-2 text-sm flex items-center gap-2 flex-1 justify-center hover:bg-red-500/20 transition-colors"
                    >
                      <X className="w-4 h-4" /> Reject
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
