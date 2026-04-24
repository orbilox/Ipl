'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminSettingsPage() {
  const [editKey, setEditKey] = useState('')
  const [editValue, setEditValue] = useState('')

  const { data, refetch } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => fetch('/api/admin/settings').then(r => r.json()),
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success('Setting updated!')
      setEditKey('')
      refetch()
    }
  })

  const settings = data?.settings || []

  const settingLabels: Record<string, { label: string; desc: string; type: string }> = {
    min_deposit: { label: 'Minimum Deposit', desc: 'Minimum deposit amount in INR', type: 'number' },
    max_deposit: { label: 'Maximum Deposit', desc: 'Maximum deposit amount per transaction', type: 'number' },
    min_withdrawal: { label: 'Minimum Withdrawal', desc: 'Minimum withdrawal amount', type: 'number' },
    max_bet: { label: 'Maximum Bet', desc: 'Maximum bet/trade amount per transaction', type: 'number' },
    platform_commission: { label: 'Platform Commission', desc: 'Commission % taken from winnings', type: 'number' },
    welcome_bonus: { label: 'Welcome Bonus', desc: 'Bonus given to new users on signup', type: 'number' },
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="font-display font-bold text-2xl text-white mb-6">Platform Settings</h1>

      <div className="space-y-4">
        {settings.map((setting: any) => {
          const meta = settingLabels[setting.key]
          const isEditing = editKey === setting.key
          return (
            <div key={setting.key} className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-medium text-white">{meta?.label || setting.key}</h3>
                  <p className="text-gray-400 text-xs">{meta?.desc}</p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => { setEditKey(setting.key); setEditValue(setting.value) }}
                    className="btn-ghost text-xs"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="flex gap-3 mt-3">
                  <input
                    type={meta?.type || 'text'}
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="input flex-1"
                  />
                  <button
                    onClick={() => updateMutation.mutate({ key: editKey, value: editValue })}
                    disabled={updateMutation.isPending}
                    className="btn-primary px-4 flex items-center gap-2 text-sm"
                  >
                    {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                  <button onClick={() => setEditKey('')} className="btn-secondary px-4 text-sm">Cancel</button>
                </div>
              ) : (
                <div className="mt-2">
                  <span className="font-bold text-orange-400 text-lg">
                    {setting.key.includes('commission') ? `${setting.value}%` : `₹${parseInt(setting.value).toLocaleString()}`}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-8 card p-5 bg-red-500/5 border-red-500/20">
        <h3 className="font-semibold text-red-400 mb-2">Danger Zone</h3>
        <p className="text-gray-400 text-sm mb-4">These actions are irreversible. Proceed with caution.</p>
        <div className="space-y-3">
          <button className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-2.5 text-sm hover:bg-red-500/20 transition-colors">
            Reset All Demo Data
          </button>
        </div>
      </div>
    </div>
  )
}
