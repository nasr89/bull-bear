'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export const LEAD_CHANNELS = ['WhatsApp', 'Instagram', 'LinkedIn', 'Referral', 'Cold Call', 'Other'] as const
export const LEAD_STATUSES = ['New', 'Contacted', 'Interested', 'Follow-Up', 'Converted', 'Lost'] as const

export type Lead = {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  channel: typeof LEAD_CHANNELS[number]
  status: typeof LEAD_STATUSES[number]
  followUpDate?: string | null
  notes?: string | null
  assignedTo?: { id: string; name: string; email: string }
}

type Props = {
  open: boolean
  lead?: Lead
  onClose: () => void
}

const EMPTY = {
  name: '',
  phone: '',
  email: '',
  channel: 'WhatsApp' as typeof LEAD_CHANNELS[number],
  status: 'New' as typeof LEAD_STATUSES[number],
  followUpDate: '',
  notes: '',
  assignedToId: '',
}

type UserOption = { id: string; name: string; email: string; role: string; isActive: boolean }

export function LeadFormModal({ open, lead, onClose }: Props) {
  const qc = useQueryClient()
  const { hasRole, user } = useAuth()
  const canAssign = hasRole('ADMIN', 'SUPERADMIN')
  const isEdit = !!lead
  const [form, setForm] = useState(EMPTY)
  const [formError, setFormError] = useState('')

  // Only admins need the user list, and only when the modal is open
  const { data: usersData } = useQuery({
    queryKey: ['users-for-assignment'],
    queryFn: () => api.get('/users').then(r => r.data),
    enabled: open && canAssign,
    staleTime: 60_000,
  })
  const assignableUsers: UserOption[] = (usersData?.users || []).filter((u: UserOption) => u.isActive)

  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        channel: lead.channel,
        status: lead.status,
        followUpDate: lead.followUpDate ? lead.followUpDate.slice(0, 10) : '',
        notes: lead.notes || '',
        assignedToId: lead.assignedTo?.id || '',
      })
    } else {
      setForm({ ...EMPTY, assignedToId: canAssign ? (user?.id || '') : '' })
    }
    setFormError('')
  }, [lead, open, canAssign, user?.id])

  const mutation = useMutation({
    mutationFn: async (payload: typeof EMPTY) => {
      const body: any = {
        name: payload.name.trim(),
        phone: payload.phone.trim() || undefined,
        email: payload.email.trim() || undefined,
        channel: payload.channel,
        status: payload.status,
        followUpDate: payload.followUpDate || undefined,
        notes: payload.notes.trim() || undefined,
      }
      if (canAssign && payload.assignedToId) {
        body.assignedToId = payload.assignedToId
      }
      if (isEdit && lead) return api.put(`/leads/${lead.id}`, body)
      return api.post('/leads', body)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      onClose()
    },
    onError: (e: any) => {
      const msg =
        e?.response?.data?.errors?.[0]?.msg ||
        e?.response?.data?.error ||
        'Request failed'
      setFormError(msg)
    },
  })

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (form.name.trim().length < 2) {
      setFormError('Name must be at least 2 characters')
      return
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setFormError('Email is invalid')
      return
    }
    mutation.mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="font-bold text-yellow-400">{isEdit ? 'Edit Lead' : 'New Lead'}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
              placeholder="Full name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Phone</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
                placeholder="+961 ..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Channel</label>
              <select
                value={form.channel}
                onChange={e => setForm(f => ({ ...f, channel: e.target.value as any }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
              >
                {LEAD_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
              >
                {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className={canAssign ? 'grid grid-cols-2 gap-4' : ''}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Follow-up Date</label>
              <input
                type="date"
                value={form.followUpDate}
                onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
              />
            </div>
            {canAssign && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Assigned to</label>
                <select
                  value={form.assignedToId}
                  onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
                >
                  <option value="">— Unassigned —</option>
                  {assignableUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 resize-none"
              placeholder="Anything relevant about this lead..."
            />
          </div>

          {formError && (
            <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">{formError}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-zinc-700 text-zinc-400 rounded-lg py-2.5 text-sm hover:border-zinc-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Lead')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
