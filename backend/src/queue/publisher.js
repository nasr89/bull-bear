import { getChannel } from './connection.js'

// Single durable queue for now; we can split into multiple queues with a
// topic exchange later if we add more event types.
export const NOTIFICATION_QUEUE = 'notifications'

async function ensureQueue(channel) {
  await channel.assertQueue(NOTIFICATION_QUEUE, { durable: true })
}

export async function publishNotification(event) {
  const channel = await getChannel()
  if (!channel) {
    // No broker — log so we know the event was dropped.
    console.warn(`⚠️  Queue disabled, dropping notification: ${event.type}`)
    return false
  }
  try {
    await ensureQueue(channel)
    const payload = Buffer.from(JSON.stringify(event))
    channel.sendToQueue(NOTIFICATION_QUEUE, payload, { persistent: true })
    return true
  } catch (err) {
    console.warn(`⚠️  Failed to publish notification: ${err.message}`)
    return false
  }
}

// Specific publisher helpers — each takes the minimum shape needed and
// builds the queue message. Keeps callers simple.

export function publishLeadAssigned({ leadId, leadName, assignee, assignedBy }) {
  if (!assignee?.email) return Promise.resolve(false)
  return publishNotification({
    type: 'LEAD_ASSIGNED',
    to: assignee.email,
    payload: {
      assigneeName: assignee.name,
      leadId,
      leadName,
      assignedByName: assignedBy?.name || 'A teammate',
    },
  })
}
