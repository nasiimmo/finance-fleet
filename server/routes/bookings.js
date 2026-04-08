const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const asyncHandler = require('../utils/asyncHandler')
const requireAuth = require('../middleware/requireAuth')
const requireAdmin = require('../middleware/requireAdmin')

const prisma = new PrismaClient()

// create booking (auth required)
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { carId, startDate, endDate } = req.body

  if (!carId || !startDate || !endDate) {
    return res.status(400).json({ error: true, message: 'Car, start date and end date are required' })
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (start >= end) {
    return res.status(400).json({ error: true, message: 'End date must be after start date' })
  }

  if (start < new Date()) {
    return res.status(400).json({ error: true, message: 'Start date cannot be in the past' })
  }

  // check car exists
  const car = await prisma.car.findUnique({
    where: { id: parseInt(carId) },
  })

  if (!car) {
    return res.status(404).json({ error: true, message: 'Car not found' })
  }

  if (car.status === 'leased') {
    return res.status(400).json({ error: true, message: 'Car is not available' })
  }

  // check for overlapping bookings
  const overlap = await prisma.booking.findFirst({
    where: {
      carId: parseInt(carId),
      status: { in: ['pending', 'confirmed'] },
      OR: [
        {
          startDate: { lte: end },
          endDate: { gte: start },
        }
      ],
    },
  })

  if (overlap) {
    return res.status(409).json({ error: true, message: 'Car is already booked for these dates' })
  }

  const booking = await prisma.booking.create({
    data: {
      userId: req.user.id,
      carId: parseInt(carId),
      startDate: start,
      endDate: end,
      status: 'pending',
    },
    include: {
      car: true,
    },
  })

  res.status(201).json({ message: 'Booking created successfully', booking })
}))

// get my bookings (auth required)
router.get('/my', requireAuth, asyncHandler(async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { userId: req.user.id },
    include: { car: true },
    orderBy: { createdAt: 'desc' },
  })

  res.json(bookings)
}))

// get single booking (auth required)
router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { car: true },
  })

  if (!booking) {
    return res.status(404).json({ error: true, message: 'Booking not found' })
  }

  if (booking.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: true, message: 'Not authorised' })
  }

  res.json(booking)
}))

// get all bookings (admin only)
router.get('/', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const bookings = await prisma.booking.findMany({
    include: {
      car: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json(bookings)
}))

// update booking status (admin only)
router.patch('/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { status } = req.body

  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(req.params.id) },
  })

  if (!booking) {
    return res.status(404).json({ error: true, message: 'Booking not found' })
  }

  const updated = await prisma.booking.update({
    where: { id: parseInt(req.params.id) },
    data: { status },
  })

  res.json({ message: 'Booking updated successfully', booking: updated })
}))

// cancel booking (auth required)
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(req.params.id) },
  })

  if (!booking) {
    return res.status(404).json({ error: true, message: 'Booking not found' })
  }

  if (booking.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: true, message: 'Not authorised' })
  }

  await prisma.booking.update({
    where: { id: parseInt(req.params.id) },
    data: { status: 'cancelled' },
  })

  res.json({ message: 'Booking cancelled successfully' })
}))

module.exports = router