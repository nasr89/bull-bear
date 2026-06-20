// Standalone worker process. Started by docker-compose as a separate
// container so it scales independently of the API.
//
// Connects to RabbitMQ, asserts the notifications queue, and consumes
// messages forever. Each message is dispatched to a handler based on
// `event.type`. Failed handlers nack-and-retry once, then drop.

import 'dotenv/config'
import amqplib from 'amqplib'
import { sendEmail } from '../services/mailer.js'
import { NOTIFICATION_QUEUE } from './publisher.js'

const RECONNECT_DELAY_MS = 5000

const handlers = {
  LEAD_ASSIGNED: async (event) => {
    const { to, payload } = event
    const subject = `New lead assigned: ${payload.leadName}`
    const text = `Hi ${payload.assigneeName},

${payload.assignedByName} has just assigned you a new lead: ${payload.leadName}.

Open Bull & Bear to follow up:
${process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:3000'}/leads

— Bull & Bear`
    const html = `<p>Hi ${payload.assigneeName},</p>
<p><strong>${payload.assignedByName}</strong> has just assigned you a new lead: <strong>${payload.leadName}</strong>.</p>
<p>Open Bull & Bear to follow up: <a href="${process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:3000'}/leads">View leads</a></p>
<p>— Bull & Bear</p>`
    await sendEmail({ to, subject, text, html })
  },
}

async function processMessage(channel, msg) {
  if (!msg) return
  let event
  try {
    event = JSON.parse(msg.content.toString())
  } catch {
    console.error('worker: invalid JSON in message, dropping')
    channel.ack(msg)
    return
  }

  const handler = handlers[event.type]
  if (!handler) {
    console.warn(`worker: no handler for event type "${event.type}", acking and dropping`)
    channel.ack(msg)
    return
  }

  try {
    await handler(event)
    channel.ack(msg)
  } catch (err) {
    console.error(`worker: handler ${event.type} threw: ${err.message}`)
    // Requeue once: rabbitmq tracks redelivery via msg.fields.redelivered
    if (msg.fields.redelivered) {
      console.error('worker: message already redelivered, dropping')
      channel.ack(msg)
    } else {
      channel.nack(msg, false, true)
    }
  }
}

async function start() {
  const url = process.env.RABBITMQ_URL
  if (!url) {
    console.error('worker: RABBITMQ_URL not set, exiting')
    process.exit(1)
  }

  while (true) {
    try {
      console.log(`worker: connecting to ${url.replace(/\/\/[^@]+@/, '//***@')}`)
      const conn = await amqplib.connect(url)
      conn.on('error', (e) => console.error('worker: connection error', e.message))
      conn.on('close', () => console.warn('worker: connection closed'))

      const channel = await conn.createChannel()
      await channel.assertQueue(NOTIFICATION_QUEUE, { durable: true })
      channel.prefetch(5)

      console.log(`worker: ready, consuming "${NOTIFICATION_QUEUE}"`)
      await channel.consume(NOTIFICATION_QUEUE, (msg) => processMessage(channel, msg))

      // Block forever until conn closes
      await new Promise((resolve) => conn.on('close', resolve))
      console.warn(`worker: reconnecting in ${RECONNECT_DELAY_MS / 1000}s…`)
    } catch (err) {
      console.error(`worker: ${err.message}`)
    }
    await new Promise((r) => setTimeout(r, RECONNECT_DELAY_MS))
  }
}

start().catch((e) => {
  console.error('worker: fatal', e)
  process.exit(1)
})
