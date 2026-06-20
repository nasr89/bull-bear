import { Router } from 'express'
import { body } from 'express-validator'
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller.js'
import { authenticate, authorize } from '../middleware/auth.middleware.js'

const router = Router()

// All user routes require authentication
router.use(authenticate)

// GET all users — ADMIN and SUPERADMIN only
router.get('/', authorize('ADMIN', 'SUPERADMIN'), getAllUsers)

// GET single user
router.get('/:id', authorize('ADMIN', 'SUPERADMIN'), getUserById)

// POST create user — ADMIN (creates USER), SUPERADMIN (creates any role)
router.post(
  '/',
  authorize('ADMIN', 'SUPERADMIN'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and a number'),
    body('role')
      .optional()
      .isIn(['USER', 'ADMIN', 'SUPERADMIN'])
      .withMessage('Invalid role'),
  ],
  createUser
)

// PUT update user
router.put(
  '/:id',
  authorize('ADMIN', 'SUPERADMIN'),
  [
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['USER', 'ADMIN', 'SUPERADMIN']),
    body('isActive').optional().isBoolean(),
  ],
  updateUser
)

// DELETE user — SUPERADMIN only
router.delete('/:id', authorize('SUPERADMIN'), deleteUser)

export default router
