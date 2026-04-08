const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const asyncHandler = require('../utils/asyncHandler')
const requireAuth = require('../middleware/requireAuth')
const requireAdmin = require('../middleware/requireAdmin')

const prisma = new PrismaClient()

// get all cars (public)
router.get('/', asyncHandler(async (req, res) => {
  const { make, model, type, fuel, status, minPrice, maxPrice } = req.query

  const filters = {}

  if (make) filters.make = { contains: make, mode: 'insensitive' }
  if (model) filters.model = { contains: model, mode: 'insensitive' }
  if (type) filters.type = { contains: type, mode: 'insensitive' }
  if (fuel) filters.fuel = { contains: fuel, mode: 'insensitive' }
  if (status) filters.status = status
  if (minPrice || maxPrice) {
    filters.price = {}
    if (minPrice) filters.price.gte = parseFloat(minPrice)
    if (maxPrice) filters.price.lte = parseFloat(maxPrice)
  }

  const cars = await prisma.car.findMany({
    where: filters,
    orderBy: { createdAt: 'desc' },
  })

  res.json(cars)
}))

// get single car (public)
router.get('/:id', asyncHandler(async (req, res) => {
  const car = await prisma.car.findUnique({
    where: { id: parseInt(req.params.id) },
  })

  if (!car) {
    return res.status(404).json({ error: true, message: 'Car not found' })
  }

  res.json(car)
}))

// create car (admin only)
router.post('/', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const {
    make, model, year, price, mileage,
    fuel, gearbox, seats, colour, type,
    description, features, images,
  } = req.body

  if (!make || !model || !year || !price || !fuel || !type) {
    return res.status(400).json({ error: true, message: 'Missing required fields' })
  }

  const car = await prisma.car.create({
    data: {
      make, model, year: parseInt(year),
      price: parseFloat(price),
      mileage: mileage || '',
      fuel, gearbox: gearbox || 'Automatic',
      seats: parseInt(seats) || 5,
      colour: colour || '',
      type, description: description || '',
      features: features || [],
      images: images || [],
      status: 'available',
    },
  })

  res.status(201).json({ message: 'Car created successfully', car })
}))

// update car (admin only)
router.patch('/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const car = await prisma.car.findUnique({
    where: { id: parseInt(req.params.id) },
  })

  if (!car) {
    return res.status(404).json({ error: true, message: 'Car not found' })
  }

  const updated = await prisma.car.update({
    where: { id: parseInt(req.params.id) },
    data: req.body,
  })

  res.json({ message: 'Car updated successfully', car: updated })
}))

// delete car (admin only)
router.delete('/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const car = await prisma.car.findUnique({
    where: { id: parseInt(req.params.id) },
  })

  if (!car) {
    return res.status(404).json({ error: true, message: 'Car not found' })
  }

  await prisma.car.delete({
    where: { id: parseInt(req.params.id) },
  })

  res.json({ message: 'Car deleted successfully' })
}))

module.exports = router