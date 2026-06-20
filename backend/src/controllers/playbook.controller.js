import { validationResult } from 'express-validator'
import { prisma } from '../config/prisma.js'
import { logAudit } from '../services/audit.js'

const CATEGORIES = ['FOLLOWUP_SCRIPT', 'WHATSAPP_MESSAGE', 'OBJECTION', 'PRO_TIP']

export async function getItems(req, res, next) {
  try {
    const { category } = req.query

    const where = {}
    if (category) {
      if (!CATEGORIES.includes(category)) {
        return res.status(400).json({ error: 'Invalid category' })
      }
      where.category = category
    }

    const items = await prisma.playbookItem.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    res.json({ items })
  } catch (err) {
    next(err)
  }
}

export async function createItem(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { category, title, body, tag, tagColor, sortOrder } = req.body

    const item = await prisma.playbookItem.create({
      data: {
        category,
        title,
        body,
        tag: tag || null,
        tagColor: tagColor || null,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      },
    })

    logAudit({ userId: req.user.id, action: 'PLAYBOOK_CREATED', resource: 'PlaybookItem', resourceId: item.id, details: { category: item.category, title: item.title } })

    res.status(201).json({ item })
  } catch (err) {
    next(err)
  }
}

export async function updateItem(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const existing = await prisma.playbookItem.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Item not found' })

    const { title, body, tag, tagColor, sortOrder } = req.body
    const data = {}
    if (title !== undefined) data.title = title
    if (body !== undefined) data.body = body
    if (tag !== undefined) data.tag = tag || null
    if (tagColor !== undefined) data.tagColor = tagColor || null
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder)

    const updated = await prisma.playbookItem.update({
      where: { id: req.params.id },
      data,
    })

    logAudit({ userId: req.user.id, action: 'PLAYBOOK_UPDATED', resource: 'PlaybookItem', resourceId: updated.id, details: { changed: Object.keys(data) } })

    res.json({ item: updated })
  } catch (err) {
    next(err)
  }
}

export async function reorderItems(req, res, next) {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids must be a non-empty array' })
    }

    // Update each item's sortOrder to its array index, in one transaction
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.playbookItem.update({ where: { id }, data: { sortOrder: index } })
      )
    )

    logAudit({
      userId: req.user.id,
      action: 'PLAYBOOK_REORDERED',
      resource: 'PlaybookItem',
      details: { count: ids.length },
    })

    res.json({ message: 'Reordered', count: ids.length })
  } catch (err) {
    next(err)
  }
}

export async function deleteItem(req, res, next) {
  try {
    const existing = await prisma.playbookItem.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Item not found' })

    await prisma.playbookItem.delete({ where: { id: req.params.id } })

    logAudit({ userId: req.user.id, action: 'PLAYBOOK_DELETED', resource: 'PlaybookItem', resourceId: req.params.id, details: { category: existing.category, title: existing.title } })

    res.json({ message: 'Item deleted' })
  } catch (err) {
    next(err)
  }
}
