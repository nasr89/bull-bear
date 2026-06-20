'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api, setAccessToken } from '@/lib/api'

export type Role = 'SUPERADMIN' | 'ADMIN' | 'USER'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  hasRole: (...roles: Role[]) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // On mount: try silent refresh then fetch user
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await api.post('/auth/refresh')
        setAccessToken(data.accessToken)
        await fetchMe()
      } catch {
        setIsLoading(false)
      }
    }
    init()
  }, [fetchMe])

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    setAccessToken(data.accessToken)
    setUser(data.user)
    router.push('/dashboard')
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setAccessToken(null)
      setUser(null)
      router.push('/auth/login')
    }
  }

  const hasRole = (...roles: Role[]) => {
    return user ? roles.includes(user.role) : false
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      isAuthenticated: !!user,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
