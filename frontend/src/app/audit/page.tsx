'use client'

import { useState, useMemo } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/lib/api'
import DashboardLayout from '../dashboard/layout'
import { RouteGuard } from '@/components/layout/RouteGuard'
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react'

type AuditLog = {
  id: string
  action: string
  resource: string
  resourceId?: string | null
  details?: any
  createdAt: string
  user: { id: string; name: string; email: string; role: string }
}

const PAGE_SIZE = 50

const ACTION_COLORS: Record<string, string> = {
  LOGIN_SUCCESS: 'bg-green-500/10 text-green-400 border-green-500/20',
  LOGIN_FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
  LOGIN_BLOCKED: 'bg-red-500/10 text-red-400 border-red-500/20',
  LOGOUT: 'bg-zinc-700/40 text-zinc-300 border-zinc-700',
  LEAD_CREATED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  LEAD_UPDATED: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  LEAD_DELETED: 'bg-red-500/10 text-red-400 border-red-500/20',
  USER_CREATED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  USER_UPDATED: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  USER_DELETED: 'bg-red-500/10 text-red-400 border-red-500/20',
  PLAYBOOK_CREATED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  PLAYBOOK_UPDATED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  PLAYBOOK_DELETED: 'bg-red-500/10 text-red-400 border-red-500/20',
  PLAYBOOK_REORDERED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
}

function timeAgo(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}

export default function AuditPage() {
  const [page, setPage] = useState(1)
  const [resource, setResource] = useState('')
  const [action, setAction] = useState('')

  const params = useMemo(() => {
    const p: Record<string, string> = { page: String(page), limit: String(PAGE_SIZE) }
    if (resource) p.resource = resource
    if (action) p.action = action
    return p
  }, [page, resource, action])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['audit', params],
    queryFn: () => api.get('/audit', { params }).then(r => r.data),
    placeholderData: keepPreviousData,
  })

  const logs: AuditLog[] = data?.logs || []
  const total = data?.total || 0
  const pages = data?.pages || 1

  return (
    <RouteGuard roles={['SUPERADMIN']}>
      <DashboardLayout>
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Audit Log</h1>
              <p className="text-zinc-400 text-sm mt-1">{total} total events</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center">
            <Filter size={14} className="text-zinc-500" />
            <select
              value={resource}
              onChange={e => { setResource(e.target.value); setPage(1) }}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
            >
              <option value="">All resources</option>
              <option value="Auth">Auth</option>
              <option value="Lead">Lead</option>
              <option value="User">User</option>
              <option value="PlaybookItem">Playbook</option>
            </select>
            <select
              value={action}
              onChange={e => { setAction(e.target.value); setPage(1) }}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
            >
              <option value="">All actions</option>
              {Object.keys(ACTION_COLORS).map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            {(resource || action) && (
              <button
                onClick={() => { setResource(''); setAction(''); setPage(1) }}
                className="text-xs text-zinc-400 hover:text-yellow-400 underline underline-offset-2"
              >
                Clear filters
              </button>
            )}
            {isFetching && <span className="text-xs text-yellow-400 ml-auto">updating…</span>}
          </div>

          {/* Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500">When</th>
                  <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Who</th>
                  <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Action</th>
                  <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Resource</th>
                  <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5} className="px-6 py-4">
                          <div className="h-6 bg-zinc-800/60 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  : logs.map(log => (
                      <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-3 text-xs text-zinc-400 font-mono whitespace-nowrap">
                          {timeAgo(log.createdAt)}
                        </td>
                        <td className="px-6 py-3 text-xs">
                          <div className="text-white font-medium">{log.user?.name || 'unknown'}</div>
                          <div className="text-zinc-500">{log.user?.role}</div>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${ACTION_COLORS[log.action] || 'bg-zinc-700/40 text-zinc-300 border-zinc-700'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-xs text-zinc-400">
                          <div>{log.resource}</div>
                          {log.resourceId && <div className="text-zinc-600 font-mono text-[10px]">{log.resourceId.slice(0, 8)}…</div>}
                        </td>
                        <td className="px-6 py-3 text-xs text-zinc-500 max-w-md">
                          {log.details ? (
                            <code className="text-zinc-400 font-mono text-[11px] break-all">
                              {JSON.stringify(log.details)}
                            </code>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
            {!isLoading && logs.length === 0 && (
              <div className="text-center py-16 text-zinc-500 text-sm">No audit entries match.</div>
            )}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <div className="text-xs text-zinc-500">
                Page <span className="text-zinc-300">{page}</span> of <span className="text-zinc-300">{pages}</span>
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
        </div>
      </DashboardLayout>
    </RouteGuard>
  )
}
