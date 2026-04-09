const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const asyncHandler = require('../utils/asyncHandler')
const requireAuth = require('../middleware/requireAuth')
const requireAdmin = require('../middleware/requireAdmin')

const prisma = new PrismaClient()

// get all faqs (public)
router.get('/', asyncHandler(async (req, res) => {
  const faqs = await prisma.fAQ.findMany({
    orderBy: { order: 'asc' },
  })

  res.json(faqs)
}))

// create faq (admin only)
router.post('/', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { question, answer, order } = req.body

  if (!question || !answer) {
    return res.status(400).json({ error: true, message: 'Question and answer are required' })
  }

  const faq = await prisma.fAQ.create({
    data: {
      question,
      answer,
      order: order ? parseInt(order) : 0,
    },
  })

  res.status(201).json({ message: 'FAQ created successfully', faq })
}))

// update faq (admin only)
router.patch('/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const faq = await prisma.fAQ.findUnique({
    where: { id: parseInt(req.params.id) },
  })

  if (!faq) {
    return res.status(404).json({ error: true, message: 'FAQ not found' })
  }

  const updated = await prisma.fAQ.update({
    where: { id: parseInt(req.params.id) },
    data: req.body,
  })

  res.json({ message: 'FAQ updated successfully', faq: updated })
}))

// delete faq (admin only)
router.delete('/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const faq = await prisma.fAQ.findUnique({
    where: { id: parseInt(req.params.id) },
  })

  if (!faq) {
    return res.status(404).json({ error: true, message: 'FAQ not found' })
  }

  await prisma.fAQ.delete({
    where: { id: parseInt(req.params.id) },
  })

  res.json({ message: 'FAQ deleted successfully' })
}))

module.exports = router