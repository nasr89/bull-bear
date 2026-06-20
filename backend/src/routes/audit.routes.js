import { Router } from 'express'
import { getAuditLogs } from '../controllers/audit.controller.js'
import { authenticate, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)
router.use(authorize('SUPERADMIN'))

router.get('/', getAuditLogs)

export default router
