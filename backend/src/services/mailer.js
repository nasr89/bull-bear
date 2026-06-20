import nodemailer from 'nodemailer'

// Lazily-created SMTP transporter. If SMTP env vars are missing, we fall
// back to a stdout-logging transport so the queue pipeline is testable
// without paying for an email service.

let transporter = null

function buildTransporter() {
  const host = process.env.SMTP_HOST
  if (!host) return null

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  })
}

function getTransporter() {
  if (!transporter) transporter = buildTransporter()
  return transporter
}

export async function sendEmail({ to, subject, text, html }) {
  const from = process.env.SMTP_FROM || 'Bull & Bear <noreply@bullandbear.lb>'

  const t = getTransporter()
  if (!t) {
    // Log-only mode: just print what we *would* have sent.
    console.log('───── [mailer] Email queued but SMTP not configured ─────')
    console.log(`From:    ${from}`)
    console.log(`To:      ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Body:\n${text || (html || '').replace(/<[^>]+>/g, '')}`)
    console.log('──────────────────────────────────────────────────────────')
    return { queued: true, sent: false }
  }

  const info = await t.sendMail({ from, to, subject, text, html })
  console.log(`✉️  Email sent to ${to} (messageId=${info.messageId})`)
  return { queued: true, sent: true, messageId: info.messageId }
}
