import { prisma } from '../config/prisma.js'

// Fire-and-forget audit logger. Never throws so business logic doesn't
// fail just because we couldn't record history.
//
// userId: the actor (the user who did the thing)
// action: enum-ish string (e.g. 'LEAD_CREATED')
// resource: noun (e.g. 'Lead', 'User', 'PlaybookItem', 'Auth')
// resourceId: optional id of the affected resource
// details: any extra structured info to stash in the JSON column

export async function logAudit({ userId, action, resource, resourceId, details }) {
  if (!userId) return // anonymous actions skipped (e.g. failed login pre-auth)
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId: resourceId || null,
        details: details ?? null,
      },
    })
  } catch (err) {
    console.warn(`audit: failed to write log (${action} ${resource}): ${err.message}`)
  }
}
