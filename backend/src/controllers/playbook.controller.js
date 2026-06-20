import { validationResult } from 'express-validator'
import { prisma } from '../config/prisma.js'

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

    res.json({ item: updated })
  } catch (err) {
    next(err)
  }
}

export async function deleteItem(req, res, next) {
  try {
    const existing = await prisma.playbookItem.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Item not found' })

    await prisma.playbookItem.delete({ where: { id: req.params.id } })
    res.json({ message: 'Item deleted' })
  } catch (err) {
    next(err)
  }
}
