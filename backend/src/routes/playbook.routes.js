import { Router } from 'express'
import { body } from 'express-validator'
import {
  getItems,
  createItem,
  updateItem,
  deleteItem,
} from '../controllers/playbook.controller.js'
import { authenticate, authorize } from '../middleware/auth.middleware.js'

const router = Router()

const CATEGORIES = ['FOLLOWUP_SCRIPT', 'WHATSAPP_MESSAGE', 'OBJECTION', 'PRO_TIP']

router.use(authenticate)

router.get('/', getItems)

router.post(
  '/',
  authorize('ADMIN', 'SUPERADMIN'),
  [
    body('category').isIn(CATEGORIES).withMessage('Invalid category'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('body').trim().notEmpty().withMessage('Body is required'),
    body('tag').optional({ checkFalsy: true }).isString(),
    body('tagColor').optional({ checkFalsy: true }).isIn(['gold', 'green', 'gray', 'red']),
    body('sortOrder').optional().isInt(),
  ],
  createItem
)

router.put(
  '/:id',
  authorize('ADMIN', 'SUPERADMIN'),
  [
    body('title').optional().trim().notEmpty(),
    body('body').optional().trim().notEmpty(),
    body('tagColor').optional({ checkFalsy: true }).isIn(['gold', 'green', 'gray', 'red']),
    body('sortOrder').optional().isInt(),
  ],
  updateItem
)

router.delete('/:id', authorize('ADMIN', 'SUPERADMIN'), deleteItem)

export default router
