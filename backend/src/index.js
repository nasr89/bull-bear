import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import leadRoutes from './routes/lead.routes.js'
import playbookRoutes from './routes/playbook.routes.js'
import { errorHandler } from './middleware/error.middleware.js'
import { getChannel } from './queue/connection.js'

const app = express()
const PORT = process.env.PORT || 4000

// ─── Security middleware ──────────────────────────────
app.use(helmet())

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    return cb(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
}))

// ─── Rate limiting ─────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
})

app.use(limiter)

// ─── Body parsing ──────────────────────────────────────
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// ─── Logging ───────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// ─── Health check ──────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── Routes ────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/leads', leadRoutes)
app.use('/api/playbook', playbookRoutes)

// ─── 404 ───────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ─── Error handler ─────────────────────────────────────
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV}`)
  console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`)
  getChannel().catch(() => {})
})

export default app
