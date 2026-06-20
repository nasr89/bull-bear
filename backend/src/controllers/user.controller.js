import bcrypt from 'bcryptjs'
import { validationResult } from 'express-validator'
import { prisma } from '../config/prisma.js'
import { logAudit } from '../services/audit.js'

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  createdBy: { select: { id: true, name: true, email: true } },
}

export async function getAllUsers(req, res, next) {
  try {
    const { role, isActive, page = 1, limit = 20 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where = {}
    if (role) where.role = role
    if (isActive !== undefined) where.isActive = isActive === 'true'

    // ADMIN can see only USERs; SUPERADMIN sees everyone
    if (req.user.role === 'ADMIN') {
      where.role = 'USER'
    }

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({ where, select: SAFE_USER_SELECT, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where }),
    ])

    res.json({ users, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) })
  } catch (err) {
    next(err)
  }
}

export async function getUserById(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: SAFE_USER_SELECT,
    })

    if (!user) return res.status(404).json({ error: 'User not found' })

    // ADMIN cannot view another ADMIN or SUPERADMIN
    if (req.user.role === 'ADMIN' && user.role !== 'USER') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    res.json({ user })
  } catch (err) {
    next(err)
  }
}

export async function createUser(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { name, email, password, role } = req.body

    // Only SUPERADMIN can create ADMIN or SUPERADMIN accounts
    if ((role === 'ADMIN' || role === 'SUPERADMIN') && req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Only SUPERADMIN can create ADMIN accounts' })
    }

    const hashedPassword = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS) || 12)

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || 'USER',
        createdById: req.user.id,
      },
      select: SAFE_USER_SELECT,
    })

    logAudit({ userId: req.user.id, action: 'USER_CREATED', resource: 'User', resourceId: user.id, details: { role: user.role, email: user.email } })

    res.status(201).json({ user })
  } catch (err) {
    next(err)
  }
}

export async function updateUser(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { name, email, role, isActive, password } = req.body
    const targetUser = await prisma.user.findUnique({ where: { id: req.params.id } })

    if (!targetUser) return res.status(404).json({ error: 'User not found' })

    // ADMIN can only update USER accounts
    if (req.user.role === 'ADMIN' && targetUser.role !== 'USER') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Only SUPERADMIN can change roles
    if (role && req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Only SUPERADMIN can change roles' })
    }

    const data = {}
    if (name) data.name = name
    if (email) data.email = email.toLowerCase()
    if (role) data.role = role
    if (isActive !== undefined) data.isActive = isActive
    if (password) data.password = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS) || 12)

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: SAFE_USER_SELECT,
    })

    logAudit({ userId: req.user.id, action: 'USER_UPDATED', resource: 'User', resourceId: updated.id, details: { changes: Object.keys(data) } })

    res.json({ user: updated })
  } catch (err) {
    next(err)
  }
}

export async function deleteUser(req, res, next) {
  try {
    const targetUser = await prisma.user.findUnique({ where: { id: req.params.id } })

    if (!targetUser) return res.status(404).json({ error: 'User not found' })
    if (targetUser.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' })
    if (targetUser.role === 'SUPERADMIN') return res.status(403).json({ error: 'Cannot delete SUPERADMIN' })

    await prisma.user.delete({ where: { id: req.params.id } })

    logAudit({ userId: req.user.id, action: 'USER_DELETED', resource: 'User', resourceId: req.params.id, details: { email: targetUser.email, role: targetUser.role } })

    res.json({ message: 'User deleted successfully' })
  } catch (err) {
    next(err)
  }
}
