import bcrypt from 'bcryptjs'
import { validationResult } from 'express-validator'
import { prisma } from '../config/prisma.js'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from '../utils/jwt.js'
import { logAudit } from '../services/audit.js'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

export async function login(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

    if (!user || !(await bcrypt.compare(password, user.password))) {
      if (user) {
        logAudit({ userId: user.id, action: 'LOGIN_FAILED', resource: 'Auth', details: { email } })
      }
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    if (!user.isActive) {
      logAudit({ userId: user.id, action: 'LOGIN_BLOCKED', resource: 'Auth', details: { reason: 'inactive' } })
      return res.status(403).json({ error: 'Account is deactivated' })
    }

    const tokenPayload = { userId: user.id, role: user.role }
    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    // Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiry(),
      },
    })

    // Set httpOnly cookie
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)

    logAudit({ userId: user.id, action: 'LOGIN_SUCCESS', resource: 'Auth' })

    res.json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies.refreshToken

    if (!token) {
      return res.status(401).json({ error: 'Refresh token missing' })
    }

    let decoded
    try {
      decoded = verifyRefreshToken(token)
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token' })
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      res.clearCookie('refreshToken')
      return res.status(401).json({ error: 'Refresh token invalid or expired' })
    }

    if (!storedToken.user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' })
    }

    // Token rotation: revoke old, issue new
    const newTokenPayload = { userId: storedToken.user.id, role: storedToken.user.role }
    const newAccessToken = generateAccessToken(newTokenPayload)
    const newRefreshToken = generateRefreshToken(newTokenPayload)

    await prisma.$transaction([
      prisma.refreshToken.update({ where: { id: storedToken.id }, data: { isRevoked: true } }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: storedToken.user.id,
          expiresAt: getRefreshTokenExpiry(),
        },
      }),
    ])

    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS)

    res.json({ accessToken: newAccessToken })
  } catch (err) {
    next(err)
  }
}

export async function logout(req, res, next) {
  try {
    const token = req.cookies.refreshToken
    let userId = null

    if (token) {
      const stored = await prisma.refreshToken.findUnique({ where: { token } })
      userId = stored?.userId || null
      await prisma.refreshToken.updateMany({
        where: { token },
        data: { isRevoked: true },
      })
    }

    res.clearCookie('refreshToken')
    if (userId) logAudit({ userId, action: 'LOGOUT', resource: 'Auth' })
    res.json({ message: 'Logged out successfully' })
  } catch (err) {
    next(err)
  }
}

export async function getMe(req, res) {
  res.json({ user: req.user })
}
