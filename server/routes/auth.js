const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const asyncHandler = require('../utils/asyncHandler')

const prisma = new PrismaClient()

// register
router.post('/register', asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: true, message: 'All fields are required' })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(400).json({ error: true, message: 'Email already in use' })
  }

  if (password.length < 8) {
    return res.status(400).json({ error: true, message: 'Password must be at least 8 characters' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      isVerified: false,
      role: 'user',
    },
  })

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  res.status(201).json({
    message: 'Account created successfully',
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
  })
}))

// login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: true, message: 'Email and password are required' })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.status(401).json({ error: true, message: 'Invalid email or password' })
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    return res.status(401).json({ error: true, message: 'Invalid email or password' })
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
  })
}))

// get current user
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: true, message: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]
  const decoded = jwt.verify(token, process.env.JWT_SECRET)

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isVerified: true,
      createdAt: true,
    },
  })

  if (!user) {
    return res.status(404).json({ error: true, message: 'User not found' })
  }

  res.json(user)
}))

module.exports = router