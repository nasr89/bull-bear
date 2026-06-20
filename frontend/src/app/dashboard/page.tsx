'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { TrendingUp, Users, CheckCircle, AlertCircle } from 'lucide-react'

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number | string; icon: any; color: string
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className={`inline-flex p-2 rounded-lg mb-3 ${color}`}>
        <Icon size={18} />
      </div>
      <div className="text-2xl font-bold font-mono text-white">{value}</div>
      <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">{label}</div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()

  // Aggregated counts (one tiny query, no row scanning on the client)
  const { data: statsData } = useQuery({
    queryKey: ['leads-stats'],
    queryFn: () => api.get('/leads/stats').then(r => r.data),
  })

  // Just the recent 8 leads for the activity list
  const { data: recentData } = useQuery({
    queryKey: ['leads-recent'],
    queryFn: () => api.get('/leads', { params: { limit: 8, page: 1 } }).then(r => r.data),
  })

  const leads = recentData?.leads || []

  const stats = {
    total: statsData?.total || 0,
    converted: statsData?.converted || 0,
    interested: statsData?.interested || 0,
    dueToday: statsData?.dueToday || 0,
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-zinc-400 text-sm mt-1">Here's your sales overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Leads" value={stats.total} icon={TrendingUp} color="bg-yellow-500/10 text-yellow-400" />
        <StatCard label="Converted" value={stats.converted} icon={CheckCircle} color="bg-green-500/10 text-green-400" />
        <StatCard label="Interested" value={stats.interested} icon={Users} color="bg-purple-500/10 text-purple-400" />
        <StatCard label="Follow-Up Today" value={stats.dueToday} icon={AlertCircle} color="bg-red-500/10 text-red-400" />
      </div>

      {/* Recent leads */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Recent Leads</h2>
          <a href="/leads" className="text-xs text-yellow-400 hover:text-yellow-300">View all →</a>
        </div>
        <div className="divide-y divide-zinc-800">
          {leads.slice(0, 8).map((lead: any) => (
            <div key={lead.id} className="px-6 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{lead.name}</div>
                <div className="text-xs text-zinc-500">{lead.channel} · {lead.phone || '—'}</div>
              </div>
              <StatusBadge status={lead.status} />
            </div>
          ))}
          {leads.length === 0 && (
            <div className="px-6 py-10 text-center text-zinc-500 text-sm">
              No leads yet. <a href="/leads" className="text-yellow-400 hover:underline">Add your first one →</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  New: 'bg-blue-500/10 text-blue-400',
  Contacted: 'bg-orange-500/10 text-orange-400',
  Interested: 'bg-purple-500/10 text-purple-400',
  'Follow-Up': 'bg-yellow-500/10 text-yellow-400',
  Converted: 'bg-green-500/10 text-green-400',
  Lost: 'bg-red-500/10 text-red-400',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${STATUS_COLORS[status] || 'bg-zinc-800 text-zinc-400'}`}>
      {status}
    </span>
  )
}
