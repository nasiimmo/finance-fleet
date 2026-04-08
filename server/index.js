const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 8000

app.use(cors())
app.use(express.json())

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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

app.listen(PORT, () => {
  console.log(`Mayfair Motors server running on http://localhost:${PORT}`)
})

module.exports = app