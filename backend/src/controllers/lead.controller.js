import { validationResult } from 'express-validator'
import { prisma } from '../config/prisma.js'
import { logAudit } from '../services/audit.js'
import { publishLeadAssigned } from '../queue/publisher.js'

export async function getLeadStats(req, res, next) {
  try {
    const where = {}
    if (req.user.role === 'USER') where.assignedToId = req.user.id

    const today = new Date()
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    const [total, byStatusRaw, dueToday] = await prisma.$transaction([
      prisma.lead.count({ where }),
      prisma.lead.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      prisma.lead.count({
        where: {
          ...where,
          followUpDate: { lte: todayEnd },
          status: { notIn: ['Converted', 'Lost'] },
        },
      }),
    ])

    const byStatus = byStatusRaw.reduce((acc, row) => {
      acc[row.status] = row._count.status
      return acc
    }, {})

    res.json({
      total,
      byStatus,
      converted: byStatus.Converted || 0,
      interested: byStatus.Interested || 0,
      contacted: byStatus.Contacted || 0,
      dueToday,
    })
  } catch (err) {
    next(err)
  }
}

export async function getLeads(req, res, next) {
  try {
    const { status, channel, search, page = 1, limit = 20 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where = {}

    // USER sees only their own leads; ADMIN/SUPERADMIN sees all
    if (req.user.role === 'USER') {
      where.assignedToId = req.user.id
    }

    if (status) where.status = status
    if (channel) where.channel = channel
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [leads, total] = await prisma.$transaction([
      prisma.lead.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { assignedTo: { select: { id: true, name: true, email: true } } },
      }),
      prisma.lead.count({ where }),
    ])

    res.json({ leads, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) })
  } catch (err) {
    next(err)
  }
}

export async function getLeadById(req, res, next) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    })

    if (!lead) return res.status(404).json({ error: 'Lead not found' })

    if (req.user.role === 'USER' && lead.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    res.json({ lead })
  } catch (err) {
    next(err)
  }
}

export async function createLead(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { name, phone, email, channel, status, followUpDate, notes, assignedToId } = req.body

    // Only ADMIN+ may assign a lead to another user. USER always gets it themselves.
    const finalAssignedToId =
      req.user.role !== 'USER' && assignedToId ? assignedToId : req.user.id

    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email,
        channel: channel || 'WhatsApp',
        status: status || 'New',
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes,
        assignedToId: finalAssignedToId,
      },
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    })

    logAudit({
      userId: req.user.id,
      action: 'LEAD_CREATED',
      resource: 'Lead',
      resourceId: lead.id,
      details: { name: lead.name, assignedToId: lead.assignedToId },
    })

    // Notify the assignee if it's someone other than the creator
    if (lead.assignedToId && lead.assignedToId !== req.user.id && lead.assignedTo) {
      publishLeadAssigned({
        leadId: lead.id,
        leadName: lead.name,
        assignee: lead.assignedTo,
        assignedBy: { name: req.user.name },
      }).catch(() => {})
    }

    res.status(201).json({ lead })
  } catch (err) {
    next(err)
  }
}

export async function updateLead(req, res, next) {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id } })

    if (!lead) return res.status(404).json({ error: 'Lead not found' })

    if (req.user.role === 'USER' && lead.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { name, phone, email, channel, status, followUpDate, notes, assignedToId } = req.body
    const data = {}

    if (name !== undefined) data.name = name
    if (phone !== undefined) data.phone = phone
    if (email !== undefined) data.email = email
    if (channel !== undefined) data.channel = channel
    if (status !== undefined) data.status = status
    if (followUpDate !== undefined) data.followUpDate = followUpDate ? new Date(followUpDate) : null
    if (notes !== undefined) data.notes = notes
    if (assignedToId !== undefined && req.user.role !== 'USER') data.assignedToId = assignedToId

    const updated = await prisma.lead.update({
      where: { id: req.params.id },
      data,
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    })

    logAudit({
      userId: req.user.id,
      action: 'LEAD_UPDATED',
      resource: 'Lead',
      resourceId: updated.id,
      details: { changed: Object.keys(data) },
    })

    // Reassignment? Notify the new assignee.
    const reassigned =
      data.assignedToId &&
      data.assignedToId !== lead.assignedToId &&
      updated.assignedToId !== req.user.id &&
      updated.assignedTo
    if (reassigned) {
      publishLeadAssigned({
        leadId: updated.id,
        leadName: updated.name,
        assignee: updated.assignedTo,
        assignedBy: { name: req.user.name },
      }).catch(() => {})
    }

    res.json({ lead: updated })
  } catch (err) {
    next(err)
  }
}

export async function deleteLead(req, res, next) {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id } })

    if (!lead) return res.status(404).json({ error: 'Lead not found' })

    if (req.user.role === 'USER' && lead.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await prisma.lead.delete({ where: { id: req.params.id } })

    logAudit({
      userId: req.user.id,
      action: 'LEAD_DELETED',
      resource: 'Lead',
      resourceId: req.params.id,
      details: { name: lead.name },
    })

    res.json({ message: 'Lead deleted' })
  } catch (err) {
    next(err)
  }
}
