'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { RouteGuard } from '@/components/layout/RouteGuard'
import { useAuth } from '@/context/AuthContext'
import { Users, BarChart2, LogOut, TrendingUp, BookOpen } from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart2, roles: ['SUPERADMIN', 'ADMIN', 'USER'] },
  { href: '/leads', label: 'Leads', icon: TrendingUp, roles: ['SUPERADMIN', 'ADMIN', 'USER'] },
  { href: '/playbook', label: 'Playbook', icon: BookOpen, roles: ['SUPERADMIN', 'ADMIN', 'USER'] },
  { href: '/users', label: 'Users', icon: Users, roles: ['SUPERADMIN', 'ADMIN'] },
]

function Sidebar() {
  const { user, logout, hasRole } = useAuth()
  const pathname = usePathname()

  return (
    <aside className="w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-zinc-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center font-mono font-bold text-black text-xs">
          B&B
        </div>
        <div>
          <div className="text-sm font-bold text-yellow-400">Bull & Bear</div>
          <div className="text-xs text-zinc-500">Sales HQ</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV.filter(item => hasRole(...item.roles as any)).map(item => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-xs font-bold text-zinc-300">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.name}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wide">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <div className="flex min-h-screen bg-zinc-950">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </RouteGuard>
  )
}
