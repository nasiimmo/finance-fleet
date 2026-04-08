const errorHandler = (err, req, res, next) => {
  const status = err.status || 500
  const message = err.message || 'Internal server error'

  console.error({
    status,
    message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  })

  res.status(status).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

module.exports = errorHandler