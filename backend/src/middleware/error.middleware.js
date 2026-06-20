export function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.path}:`, err)

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'A record with this value already exists' })
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' })
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  const status = err.status || err.statusCode || 500
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Internal server error'
    : err.message || 'Something went wrong'

  res.status(status).json({ error: message })
}
