import { validationResult } from 'express-validator'
import { prisma } from '../config/prisma.js'

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

    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email,
        channel: channel || 'WhatsApp',
        status: status || 'New',
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes,
        assignedToId: assignedToId || req.user.id,
      },
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    })

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

    res.json({ message: 'Lead deleted' })
  } catch (err) {
    next(err)
  }
}
