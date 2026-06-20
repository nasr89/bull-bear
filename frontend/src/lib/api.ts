import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // send httpOnly cookie automatically
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token from memory to every request
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Silent refresh on 401 TOKEN_EXPIRED
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry
    ) {
      original._retry = true

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }

      isRefreshing = true

      try {
        const { data } = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const newToken = data.accessToken
        setAccessToken(newToken)
        refreshQueue.forEach((cb) => cb(newToken))
        refreshQueue = []
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        setAccessToken(null)
        if (typeof window !== 'undefined') window.location.href = '/auth/login'
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// In-memory token store (never localStorage for security)
let _accessToken: string | null = null
export const getAccessToken = () => _accessToken
export const setAccessToken = (token: string | null) => { _accessToken = token }
