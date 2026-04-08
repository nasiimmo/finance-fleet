const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const asyncHandler = require('../utils/asyncHandler')
const requireAuth = require('../middleware/requireAuth')

const prisma = new PrismaClient()

// get my favourites (auth required)
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const favourites = await prisma.favourite.findMany({
    where: { userId: req.user.id },
    include: { car: true },
    orderBy: { createdAt: 'desc' },
  })

  res.json(favourites)
}))

// add to favourites (auth required)
router.post('/:carId', requireAuth, asyncHandler(async (req, res) => {
  const carId = parseInt(req.params.carId)

  const car = await prisma.car.findUnique({
    where: { id: carId },
  })

  if (!car) {
    return res.status(404).json({ error: true, message: 'Car not found' })
  }

  const existing = await prisma.favourite.findUnique({
    where: {
      userId_carId: {
        userId: req.user.id,
        carId,
      },
    },
  })

  if (existing) {
    return res.status(400).json({ error: true, message: 'Car already in favourites' })
  }

  const favourite = await prisma.favourite.create({
    data: {
      userId: req.user.id,
      carId,
    },
    include: { car: true },
  })

  res.status(201).json({ message: 'Added to favourites', favourite })
}))

// remove from favourites (auth required)
router.delete('/:carId', requireAuth, asyncHandler(async (req, res) => {
  const carId = parseInt(req.params.carId)

  const existing = await prisma.favourite.findUnique({
    where: {
      userId_carId: {
        userId: req.user.id,
        carId,
      },
    },
  })

  if (!existing) {
    return res.status(404).json({ error: true, message: 'Car not in favourites' })
  }

  await prisma.favourite.delete({
    where: {
      userId_carId: {
        userId: req.user.id,
        carId,
      },
    },
  })

  res.json({ message: 'Removed from favourites' })
}))

module.exports = router