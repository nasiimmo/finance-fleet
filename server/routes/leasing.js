const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const asyncHandler = require('../utils/asyncHandler')
const requireAuth = require('../middleware/requireAuth')
const requireAdmin = require('../middleware/requireAdmin')

const prisma = new PrismaClient()

// submit leasing form (public)
router.post('/', asyncHandler(async (req, res) => {
  const { name, email, phone, message } = req.body

  if (!name || !email || !phone) {
    return res.status(400).json({ error: true, message: 'Name, email and phone are required' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: true, message: 'Invalid email address' })
  }

  const form = await prisma.leasingForm.create({
    data: {
      name,
      email,
      phone,
      message: message || null,
      userId: null,
    },
  })

  res.status(201).json({ message: 'Leasing enquiry submitted successfully', form })
}))

// get all leasing forms (admin only)
router.get('/', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const forms = await prisma.leasingForm.findMany({
    orderBy: { createdAt: 'desc' },
  })

  res.json(forms)
}))

// delete leasing form (admin only)
router.delete('/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const form = await prisma.leasingForm.findUnique({
    where: { id: parseInt(req.params.id) },
  })

  if (!form) {
    return res.status(404).json({ error: true, message: 'Leasing form not found' })
  }

  await prisma.leasingForm.delete({
    where: { id: parseInt(req.params.id) },
  })

  res.json({ message: 'Leasing form deleted successfully' })
}))

module.exports = router