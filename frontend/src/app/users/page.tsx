'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { RouteGuard } from '@/components/layout/RouteGuard'
import { useAuth } from '@/context/AuthContext'
import { Plus, Trash2, Edit, Shield, ShieldCheck, User } from 'lucide-react'
import DashboardLayout from '../dashboard/layout'

const ROLE_ICONS = {
  SUPERADMIN: ShieldCheck,
  ADMIN: Shield,
  USER: User,
}

const ROLE_COLORS = {
  SUPERADMIN: 'bg-red-500/10 text-red-400 border-red-500/20',
  ADMIN: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  USER: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
}

export default function UsersPage() {
  const { hasRole } = useAuth()
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' })
  const [formError, setFormError] = useState('')

  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/users', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setShowModal(false)
      setForm({ name: '', email: '', password: '', role: 'USER' })
    },
    onError: (e: any) => setFormError(e?.response?.data?.error || 'Failed to create user'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/users/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    createMutation.mutate(form)
  }

  const users = data?.users || []

  return (
    <RouteGuard roles={['SUPERADMIN', 'ADMIN']}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Users</h1>
            <p className="text-zinc-400 text-sm mt-1">{data?.total || 0} total users</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Plus size={15} /> Add User
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Name</th>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Email</th>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Role</th>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {users.map((u: any) => {
                const RoleIcon = ROLE_ICONS[u.role as keyof typeof ROLE_ICONS]
                return (
                  <tr key={u.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{u.name}</td>
                    <td className="px-6 py-4 text-zinc-400">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${ROLE_COLORS[u.role as keyof typeof ROLE_COLORS]}`}>
                        <RoleIcon size={11} />{u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.isActive ? 'bg-green-500/10 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        {hasRole('SUPERADMIN') && u.role !== 'SUPERADMIN' && (
                          <>
                            <button
                              onClick={() => toggleActive.mutate({ id: u.id, isActive: !u.isActive })}
                              className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-yellow-400 transition-colors"
                              title={u.isActive ? 'Deactivate' : 'Activate'}
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => { if (confirm('Delete this user?')) deleteMutation.mutate(u.id) }}
                              className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-12 text-zinc-500">No users found.</div>
          )}
        </div>

        {/* Create user modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
              <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="font-bold text-yellow-400">Create New User</h3>
                <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white">✕</button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Full Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500" placeholder="Ahmad Khalil" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500" placeholder="user@bullandbear.lb" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Password</label>
                  <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500" placeholder="Min 8 chars, uppercase + number" />
                </div>
                {hasRole('SUPERADMIN') && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Role</label>
                    <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500">
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPERADMIN">Superadmin</option>
                    </select>
                  </div>
                )}
                {formError && <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">{formError}</div>}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 border border-zinc-700 text-zinc-400 rounded-lg py-2.5 text-sm hover:border-zinc-600 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={createMutation.isPending}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50">
                    {createMutation.isPending ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  )
}
