const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const asyncHandler = require('../utils/asyncHandler')
const requireAuth = require('../middleware/requireAuth')
const requireAdmin = require('../middleware/requireAdmin')

const prisma = new PrismaClient()

// create enquiry (public)
router.post('/', asyncHandler(async (req, res) => {
  const { name, email, phone, message, carId } = req.body

  if (!name || !email || !message) {
    return res.status(400).json({ error: true, message: 'Name, email and message are required' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: true, message: 'Invalid email address' })
  }

  const enquiry = await prisma.enquiry.create({
    data: {
      name,
      email,
      phone: phone || null,
      message,
      carId: carId ? parseInt(carId) : null,
      userId: null,
    },
  })

  res.status(201).json({ message: 'Enquiry submitted successfully', enquiry })
}))

// get all enquiries (admin only)
router.get('/', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const enquiries = await prisma.enquiry.findMany({
    orderBy: { createdAt: 'desc' },
  })

  res.json(enquiries)
}))

// get single enquiry (admin only)
router.get('/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id: parseInt(req.params.id) },
  })

  if (!enquiry) {
    return res.status(404).json({ error: true, message: 'Enquiry not found' })
  }

  res.json(enquiry)
}))

// delete enquiry (admin only)
router.delete('/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id: parseInt(req.params.id) },
  })

  if (!enquiry) {
    return res.status(404).json({ error: true, message: 'Enquiry not found' })
  }

  await prisma.enquiry.delete({
    where: { id: parseInt(req.params.id) },
  })

  res.json({ message: 'Enquiry deleted successfully' })
}))

module.exports = router