'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Minus, Check, X, Shield, UserCheck, Loader2 } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [actionAmount, setActionAmount] = useState('')
  const [actionNote, setActionNote] = useState('')
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => fetch(`/api/admin/users?search=${search}`).then(r => r.json()),
    refetchInterval: 30000,
  })

  const actionMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success(data.message)
      setSelectedUser(null)
      setActionAmount('')
      refetch()
    }
  })

  function performAction(action: string) {
    if (!selectedUser) return
    actionMutation.mutate({
      userId: selectedUser.id,
      action,
      amount: actionAmount ? parseFloat(actionAmount) : undefined,
      note: actionNote || undefined,
    })
  }

  const users = data?.users || []

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-white">User Management</h1>
        <div className="text-gray-400 text-sm">{data?.total || 0} total users</div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="input pl-10"
        />
      </div>

      {/* Action Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md">
            <h3 className="font-bold text-white text-lg mb-2">{selectedUser.name}</h3>
            <p className="text-gray-400 text-sm mb-4">{selectedUser.email} · Balance: {formatCurrency(selectedUser.balance)}</p>

            <div className="space-y-3 mb-4">
              <input
                type="number"
                value={actionAmount}
                onChange={e => setActionAmount(e.target.value)}
                placeholder="Amount (for balance actions)"
                className="input"
              />
              <input
                type="text"
                value={actionNote}
                onChange={e => setActionNote(e.target.value)}
                placeholder="Note (optional)"
                className="input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={() => performAction('add_balance')}
                disabled={actionMutation.isPending}
                className="btn-primary text-sm py-2.5 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Balance
              </button>
              <button onClick={() => performAction('deduct_balance')}
                disabled={actionMutation.isPending}
                className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-2.5 text-sm flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors">
                <Minus className="w-4 h-4" /> Deduct Balance
              </button>
              <button onClick={() => performAction('verify_kyc')}
                disabled={actionMutation.isPending}
                className="btn-secondary text-sm py-2.5 flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" /> Verify KYC
              </button>
              <button onClick={() => performAction(selectedUser.isActive ? 'deactivate' : 'activate')}
                disabled={actionMutation.isPending}
                className={cn('text-sm py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors',
                  selectedUser.isActive
                    ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                    : 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20'
                )}>
                {selectedUser.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                {selectedUser.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>

            <button onClick={() => setSelectedUser(null)} className="btn-ghost w-full text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/30">
                  <th className="text-left p-4 font-medium text-gray-400">User</th>
                  <th className="text-left p-4 font-medium text-gray-400 hidden md:table-cell">Balance</th>
                  <th className="text-left p-4 font-medium text-gray-400 hidden sm:table-cell">Status</th>
                  <th className="text-left p-4 font-medium text-gray-400 hidden lg:table-cell">KYC</th>
                  <th className="text-left p-4 font-medium text-gray-400 hidden lg:table-cell">Joined</th>
                  <th className="text-right p-4 font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user.id} className="border-b border-gray-800/30 hover:bg-gray-800/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-white font-medium">{user.name}</div>
                          <div className="text-gray-500 text-xs">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="text-white font-medium">{formatCurrency(user.balance)}</div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className={cn('badge text-xs', user.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400')}>
                        {user.isActive ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className={cn('badge text-xs',
                        user.kycStatus === 'verified' ? 'bg-green-500/10 text-green-400' :
                        user.kycStatus === 'rejected' ? 'bg-red-500/10 text-red-400' :
                        'bg-yellow-500/10 text-yellow-400'
                      )}>
                        {user.kycStatus}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell text-gray-400 text-xs">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="btn-ghost text-xs px-3 py-1.5"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
