'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Plus, Trash2, Edit, Search, ChevronLeft, ChevronRight, Phone, Mail, Send } from 'lucide-react'
import DashboardLayout from '../dashboard/layout'
import {
  LeadFormModal,
  LEAD_CHANNELS,
  LEAD_STATUSES,
  type Lead,
} from '@/components/leads/LeadFormModal'
import { WhatsAppModal } from '@/components/leads/WhatsAppModal'

const STATUS_COLORS: Record<string, string> = {
  New: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Contacted: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Interested: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Follow-Up': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Converted: 'bg-green-500/10 text-green-400 border-green-500/20',
  Lost: 'bg-zinc-700/40 text-zinc-400 border-zinc-700',
}

const CHANNEL_COLORS: Record<string, string> = {
  WhatsApp: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Instagram: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  LinkedIn: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  Referral: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Cold Call': 'bg-zinc-700/40 text-zinc-300 border-zinc-700',
  Other: 'bg-zinc-700/40 text-zinc-300 border-zinc-700',
}

const PAGE_SIZE = 20

function formatDate(s?: string | null) {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function LeadsPage() {
  const { hasRole } = useAuth()
  const qc = useQueryClient()
  const canDelete = hasRole('ADMIN', 'SUPERADMIN')

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [channelFilter, setChannelFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Lead | undefined>()
  const [waOpen, setWaOpen] = useState(false)
  const [waLead, setWaLead] = useState<Lead | undefined>()

  const queryParams = useMemo(() => {
    const p: Record<string, string> = { page: String(page), limit: String(PAGE_SIZE) }
    if (statusFilter) p.status = statusFilter
    if (channelFilter) p.channel = channelFilter
    if (search) p.search = search
    return p
  }, [page, statusFilter, channelFilter, search])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['leads', queryParams],
    queryFn: () => api.get('/leads', { params: queryParams }).then(r => r.data),
    placeholderData: keepPreviousData,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/leads/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })

  const leads: Lead[] = data?.leads || []
  const total: number = data?.total || 0
  const pages: number = data?.pages || 1

  const openNew = () => { setEditing(undefined); setShowModal(true) }
  const openEdit = (l: Lead) => { setEditing(l); setShowModal(true) }

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  const resetFilters = () => {
    setStatusFilter('')
    setChannelFilter('')
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Leads</h1>
            <p className="text-zinc-400 text-sm mt-1">{total} total leads</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Plus size={15} /> New Lead
          </button>
        </div>

        {/* Filter bar */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center">
          <form onSubmit={submitSearch} className="flex items-center gap-2 flex-1 min-w-[220px]">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search name, phone, email, notes..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
              />
            </div>
            <button
              type="submit"
              className="border border-zinc-700 hover:border-yellow-500 text-zinc-300 hover:text-yellow-400 rounded-lg px-3 py-2 text-sm transition-colors"
            >
              Search
            </button>
          </form>

          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
          >
            <option value="">All statuses</option>
            {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={channelFilter}
            onChange={e => { setChannelFilter(e.target.value); setPage(1) }}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
          >
            <option value="">All channels</option>
            {LEAD_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {(statusFilter || channelFilter || search) && (
            <button
              onClick={resetFilters}
              className="text-xs text-zinc-400 hover:text-yellow-400 underline underline-offset-2"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Name</th>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Contact</th>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Channel</th>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Status</th>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Follow-up</th>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Assigned</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-6 bg-zinc-800/60 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : leads.map((l) => (
                <tr key={l.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{l.name}</td>
                  <td className="px-6 py-4 text-zinc-400">
                    <div className="flex flex-col gap-0.5">
                      {l.phone && (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Phone size={11} /> {l.phone}
                        </span>
                      )}
                      {l.email && (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Mail size={11} /> {l.email}
                        </span>
                      )}
                      {!l.phone && !l.email && <span className="text-zinc-600">—</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${CHANNEL_COLORS[l.channel] || CHANNEL_COLORS.Other}`}>
                      {l.channel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[l.status] || STATUS_COLORS.New}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-xs">{formatDate(l.followUpDate)}</td>
                  <td className="px-6 py-4 text-zinc-400 text-xs">{l.assignedTo?.name || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      {l.phone && (
                        <button
                          onClick={() => { setWaLead(l); setWaOpen(true) }}
                          className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-green-400 transition-colors"
                          title="Send via WhatsApp"
                        >
                          <Send size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(l)}
                        className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-yellow-400 transition-colors"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => { if (confirm(`Delete lead "${l.name}"?`)) deleteMutation.mutate(l.id) }}
                          className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && leads.length === 0 && (
            <div className="text-center py-16 text-zinc-500">
              <div className="text-sm mb-2">No leads found.</div>
              <button
                onClick={openNew}
                className="text-xs text-yellow-400 hover:text-yellow-300 underline underline-offset-2"
              >
                Create your first lead
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between mt-4 px-2">
            <div className="text-xs text-zinc-500">
              Page <span className="text-zinc-300">{page}</span> of <span className="text-zinc-300">{pages}</span>
              {isFetching && <span className="ml-2 text-yellow-400">updating…</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:border-yellow-500 hover:text-yellow-400 transition-colors"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:border-yellow-500 hover:text-yellow-400 transition-colors"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        <LeadFormModal open={showModal} lead={editing} onClose={() => setShowModal(false)} />
        <WhatsAppModal open={waOpen} lead={waLead} onClose={() => setWaOpen(false)} />
      </div>
    </DashboardLayout>
  )
}
