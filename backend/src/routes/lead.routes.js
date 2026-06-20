import { Router } from 'express'
import { body } from 'express-validator'
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
} from '../controllers/lead.controller.js'
import { authenticate, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)

router.get('/', getLeads)
router.get('/:id', getLeadById)

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Lead name is required'),
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('channel')
      .optional()
      .isIn(['WhatsApp', 'Instagram', 'LinkedIn', 'Referral', 'Cold Call', 'Other']),
    body('status')
      .optional()
      .isIn(['New', 'Contacted', 'Interested', 'Follow-Up', 'Converted', 'Lost']),
  ],
  createLead
)

router.put('/:id', updateLead)

router.delete('/:id', authorize('ADMIN', 'SUPERADMIN'), deleteLead)

export default router
