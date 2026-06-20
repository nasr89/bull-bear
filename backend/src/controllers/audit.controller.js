import { prisma } from '../config/prisma.js'

export async function getAuditLogs(req, res, next) {
  try {
    const { userId, resource, action, from, to, page = 1, limit = 50 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where = {}
    if (userId) where.userId = userId
    if (resource) where.resource = resource
    if (action) where.action = action
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      }),
      prisma.auditLog.count({ where }),
    ])

    res.json({
      logs,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    })
  } catch (err) {
    next(err)
  }
}
