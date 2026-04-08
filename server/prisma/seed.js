const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // create test user
  const hashedPassword = await bcrypt.hash('Test1234!', 10)

  const user = await prisma.user.upsert({
    where: { email: 'test@mayfairmotors.co.uk' },
    update: {},
    create: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@mayfairmotors.co.uk',
      password: hashedPassword,
      isVerified: true,
      role: 'user',
    },
  })

  // create admin user
  const adminPassword = await bcrypt.hash('Admin1234!', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mayfairmotors.co.uk' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'Mayfair',
      email: 'admin@mayfairmotors.co.uk',
      password: adminPassword,
      isVerified: true,
      role: 'admin',
    },
  })

  // create sample cars
  const cars = [
    {
      make: 'BMW',
      model: '7 Series 750i M Sport',
      year: 2024,
      price: 1299,
      mileage: '3,100 mi',
      fuel: 'Petrol',
      gearbox: 'Automatic',
      seats: 5,
      colour: 'Carbon Black',
      type: 'saloon',
      description: 'The BMW 7 Series 750i represents the pinnacle of executive luxury.',
      features: ['Executive lounge', 'B&W audio', 'Theatre screen', 'Massage seats'],
      images: [],
      status: 'available',
    },
    {
      make: 'Mercedes',
      model: 'S-Class S580',
      year: 2023,
      price: 1149,
      mileage: '5,200 mi',
      fuel: 'Petrol',
      gearbox: 'Automatic',
      seats: 5,
      colour: 'Obsidian Black',
      type: 'saloon',
      description: 'The Mercedes S-Class sets the benchmark for luxury saloons.',
      features: ['Burmester audio', 'Rear entertainment', 'Massage seats', 'Night vision'],
      images: [],
      status: 'available',
    },
    {
      make: 'Bentley',
      model: 'Continental GT',
      year: 2024,
      price: 2499,
      mileage: '1,800 mi',
      fuel: 'Petrol',
      gearbox: 'Automatic',
      seats: 4,
      colour: 'Midnight Emerald',
      type: 'coupe',
      description: 'The Bentley Continental GT is the definitive grand tourer.',
      features: ['Naim audio', 'Rotating display', 'Heated seats', 'Ambient lighting'],
      images: [],
      status: 'available',
    },
    {
      make: 'Rolls-Royce',
      model: 'Ghost',
      year: 2023,
      price: 3999,
      mileage: '2,400 mi',
      fuel: 'Petrol',
      gearbox: 'Automatic',
      seats: 5,
      colour: 'Arctic White',
      type: 'saloon',
      description: 'The Rolls-Royce Ghost is the most technologically advanced car ever made.',
      features: ['Starlight headliner', 'Champagne cooler', 'Massage seats', 'Bespoke audio'],
      images: [],
      status: 'available',
    },
    {
      make: 'Porsche',
      model: 'Panamera Turbo S',
      year: 2024,
      price: 1799,
      mileage: '4,100 mi',
      fuel: 'Petrol',
      gearbox: 'Automatic',
      seats: 4,
      colour: 'Jet Black',
      type: 'saloon',
      description: 'The Porsche Panamera Turbo S combines supercar performance with luxury.',
      features: ['Sport Chrono', 'Burmester audio', 'Panoramic roof', 'Night vision'],
      images: [],
      status: 'available',
    },
    {
      make: 'BMW',
      model: 'X7 M60i',
      year: 2024,
      price: 999,
      mileage: '6,200 mi',
      fuel: 'Petrol',
      gearbox: 'Automatic',
      seats: 7,
      colour: 'Sophisto Grey',
      type: 'suv',
      description: 'The BMW X7 M60i is the ultimate luxury SUV for families.',
      features: ['Sky Lounge roof', 'Bowers & Wilkins audio', 'Massage seats', 'Gesture control'],
      images: [],
      status: 'available',
    }
  ]

  for (const car of cars) {
    await prisma.car.create({ data: car })
  }

  // create sample FAQs
  const faqs = [
    {
      question: 'What documents do I need to lease a vehicle?',
      answer: 'You will need a valid UK driving licence, proof of address, and a credit check.',
      order: 1,
    },
    {
      question: 'Is insurance included in the lease price?',
      answer: 'Insurance is not included. We recommend using a specialist high-value vehicle insurer.',
      order: 2,
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept card payments, bank transfer, and cash. For cryptocurrency payments please contact us via WhatsApp.',
      order: 3,
    },
    {
      question: 'Can I extend my lease?',
      answer: 'Yes, lease extensions are available subject to vehicle availability. Contact us at least 2 weeks before your lease ends.',
      order: 4,
    },
    {
      question: 'What happens if the vehicle is damaged?',
      answer: 'All damage must be reported immediately. You will be liable for repair costs not covered by your insurance.',
      order: 5,
    }
  ]

  for (const faq of faqs) {
    await prisma.fAQ.create({ data: faq })
  }

  // create sample QR codes
  const qrCodes = [
    { label: 'Leasing Group', url: 'https://chat.whatsapp.com/leasing', type: 'leasing' },
    { label: 'Renters Group', url: 'https://chat.whatsapp.com/renters', type: 'renters' },
    { label: 'Insurance Group', url: 'https://chat.whatsapp.com/insurance', type: 'insurance' },
    { label: 'Free Game Group', url: 'https://chat.whatsapp.com/freegame', type: 'freegame' }
  ]

  for (const qr of qrCodes) {
    await prisma.qRCode.create({ data: qr })
  }

  console.log('Database seeded successfully')
  console.log('Test user: test@mayfairmotors.co.uk / Test1234!')
  console.log('Admin user: admin@mayfairmotors.co.uk / Admin1234!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })