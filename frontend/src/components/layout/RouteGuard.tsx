'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, Role } from '@/context/AuthContext'

interface GuardProps {
  children: React.ReactNode
  roles?: Role[]
}

export function RouteGuard({ children, roles }: GuardProps) {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (roles && !hasRole(...roles)) {
      router.push('/dashboard')
    }
  }, [isLoading, isAuthenticated, roles, hasRole, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-yellow-500 border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) return null
  if (roles && !hasRole(...roles)) return null

  return <>{children}</>
}
