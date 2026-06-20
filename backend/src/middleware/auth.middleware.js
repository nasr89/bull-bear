import { verifyAccessToken } from '../utils/jwt.js'
import { prisma } from '../config/prisma.js'

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyAccessToken(token)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or deactivated' })
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired', code: 'TOKEN_EXPIRED' })
    }
    return res.status(401).json({ error: 'Invalid access token' })
  }
}

// Role-based access control middleware factory
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden: insufficient permissions',
        required: roles,
        current: req.user.role,
      })
    }

    next()
  }
}
