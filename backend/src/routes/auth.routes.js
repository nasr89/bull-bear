import { Router } from 'express'
import { body } from 'express-validator'
import { login, refresh, logout, getMe } from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  login
)

router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/me', authenticate, getMe)

export default router
