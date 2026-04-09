const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const checkDb = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'ok' }
  } catch (err) {
    return { status: 'error', message: err.message }
  }
}

module.exports = { checkDb, prisma }