const express = require('express')
const cors = require('cors')
require('dotenv').config()

const validateEnv = require('./utils/validateEnv')
const errorHandler = require('./middleware/errorHandler')
const logger = require('./utils/logger')
const { checkDb } = require('./utils/dbHealth')
const { globalLimiter, authLimiter, paymentLimiter } = require('./middleware/rateLimiter')
const helmet = require('helmet')

const authRoutes = require('./routes/auth')
const carRoutes = require('./routes/cars')
const bookingRoutes = require('./routes/bookings')
const favouriteRoutes = require('./routes/favourites')
const enquiryRoutes = require('./routes/enquiries')
const leasingRoutes = require('./routes/leasing')
const faqRoutes = require('./routes/faqs')
const qrcodeRoutes = require('./routes/qrcodes')
const paymentRoutes = require('./routes/payments')

validateEnv()

const app = express()
const PORT = process.env.PORT || 8000

app.use(helmet())
app.use(cors())
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))
app.use(express.json())

app.use(globalLimiter)
app.use('/api/auth', authLimiter)
app.use('/api/payments', paymentLimiter)

app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  })
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/cars', carRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/favourites', favouriteRoutes)
app.use('/api/enquiries', enquiryRoutes)
app.use('/api/leasing', leasingRoutes)
app.use('/api/faqs', faqRoutes)
app.use('/api/qrcodes', qrcodeRoutes)
app.use('/api/payments', paymentRoutes)

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Mayfair Motors API</title>
        <style>
          body { font-family: sans-serif; background: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; flex-direction: column; gap: 12px; }
          h1 { color: #c9a84c; letter-spacing: 2px; }
          p { color: #666; font-size: 13px; }
          span { color: #27ae60; }
        </style>
      </head>
      <body>
        <h1>Mayfair Motors</h1>
        <p>Server status: <span>Online</span></p>
        <p>Port: ${PORT}</p>
        <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
      </body>
    </html>
  `)
})

app.get('/health', async (req, res) => {
  const db = await checkDb()
  const status = db.status === 'ok' ? 'ok' : 'degraded'

  res.status(db.status === 'ok' ? 200 : 503).json({
    status,
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database: db.status,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB',
    },
  })
})

app.use((req, res) => {
  res.status(404).json({ error: true, message: `Route ${req.path} not found` })
})

app.use(errorHandler)

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason)
  process.exit(1)
})

const server = app.listen(PORT, () => {
  logger.info(`Mayfair Motors server running on http://localhost:${PORT}`)
})

process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

module.exports = app