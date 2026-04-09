const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const QRCode = require('qrcode')
const asyncHandler = require('../utils/asyncHandler')
const requireAuth = require('../middleware/requireAuth')
const requireAdmin = require('../middleware/requireAdmin')

const prisma = new PrismaClient()

// get all qr codes (public)
router.get('/', asyncHandler(async (req, res) => {
  const qrcodes = await prisma.qRCode.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const qrcodesWithImages = await Promise.all(
    qrcodes.map(async (qr) => {
      const qrImage = await QRCode.toDataURL(qr.url)
      return { ...qr, qrImage }
    })
  )

  res.json(qrcodesWithImages)
}))

// create qr code (admin only)
router.post('/', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { label, url, type } = req.body

  if (!label || !url || !type) {
    return res.status(400).json({ error: true, message: 'Label, url and type are required' })
  }

  const qrImage = await QRCode.toDataURL(url)

  const qrcode = await prisma.qRCode.create({
    data: { label, url, type, image: qrImage },
  })

  res.status(201).json({ message: 'QR code created successfully', qrcode })
}))

// update qr code (admin only)
router.patch('/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const qrcode = await prisma.qRCode.findUnique({
    where: { id: parseInt(req.params.id) },
  })

  if (!qrcode) {
    return res.status(404).json({ error: true, message: 'QR code not found' })
  }

  const { label, url, type } = req.body
  const qrImage = url ? await QRCode.toDataURL(url) : qrcode.image

  const updated = await prisma.qRCode.update({
    where: { id: parseInt(req.params.id) },
    data: {
      label: label || qrcode.label,
      url: url || qrcode.url,
      type: type || qrcode.type,
      image: qrImage,
    },
  })

  res.json({ message: 'QR code updated successfully', qrcode: updated })
}))

// delete qr code (admin only)
router.delete('/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const qrcode = await prisma.qRCode.findUnique({
    where: { id: parseInt(req.params.id) },
  })

  if (!qrcode) {
    return res.status(404).json({ error: true, message: 'QR code not found' })
  }

  await prisma.qRCode.delete({
    where: { id: parseInt(req.params.id) },
  })

  res.json({ message: 'QR code deleted successfully' })
}))

module.exports = router