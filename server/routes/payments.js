const express = require('express')
const router = express.Router()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { PrismaClient } = require('@prisma/client')
const asyncHandler = require('../utils/asyncHandler')
const requireAuth = require('../middleware/requireAuth')

const prisma = new PrismaClient()

// create checkout session
router.post('/create-checkout-session', requireAuth, asyncHandler(async (req, res) => {
  const { bookingId } = req.body

  if (!bookingId) {
    return res.status(400).json({ error: true, message: 'Booking ID is required' })
  }

  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    include: { car: true },
  })

  if (!booking) {
    return res.status(404).json({ error: true, message: 'Booking not found' })
  }

  if (booking.userId !== req.user.id) {
    return res.status(403).json({ error: true, message: 'Not authorised' })
  }

  const startDate = new Date(booking.startDate)
  const endDate = new Date(booking.endDate)
  const weeks = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24 * 7)))
  const totalAmount = (booking.car.price * weeks + 150) * 100

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `${booking.car.make} ${booking.car.model}`,
            description: `Lease from ${startDate.toDateString()} to ${endDate.toDateString()}`,
          },
          unit_amount: totalAmount,
        },
        quantity: 1,
      }
    ],
    success_url: `${process.env.CLIENT_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/booking/cancel`,
    metadata: {
      bookingId: booking.id.toString(),
      userId: req.user.id.toString(),
    },
  })

  res.json({ url: session.url, sessionId: session.id })
}))

// stripe webhook — listens for payment confirmation
router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const bookingId = parseInt(session.metadata.bookingId)

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'confirmed' },
    })

    await prisma.payment.create({
      data: {
        bookingId,
        amount: session.amount_total / 100,
        method: 'card',
        status: 'paid',
        stripeId: session.payment_intent,
      },
    })
  }

  res.json({ received: true })
}))

// get payment for a booking
router.get('/booking/:bookingId', requireAuth, asyncHandler(async (req, res) => {
  const payment = await prisma.payment.findFirst({
    where: { bookingId: parseInt(req.params.bookingId) },
  })

  if (!payment) {
    return res.status(404).json({ error: true, message: 'Payment not found' })
  }

  res.json(payment)
}))

module.exports = router