import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const superadminPassword = await bcrypt.hash('SuperAdmin@123', 12)
  const adminPassword = await bcrypt.hash('Admin@123', 12)
  const userPassword = await bcrypt.hash('User@123', 12)

  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@bullandbear.lb' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@bullandbear.lb',
      password: superadminPassword,
      role: 'SUPERADMIN',
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bullandbear.lb' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@bullandbear.lb',
      password: adminPassword,
      role: 'ADMIN',
      createdById: superadmin.id,
    },
  })

  await prisma.user.upsert({
    where: { email: 'user@bullandbear.lb' },
    update: {},
    create: {
      name: 'Sales Rep',
      email: 'user@bullandbear.lb',
      password: userPassword,
      role: 'USER',
      createdById: admin.id,
    },
  })

  console.log('✅ Seed complete.')
  console.log('─────────────────────────────────────────')
  console.log('SUPERADMIN → superadmin@bullandbear.lb / SuperAdmin@123')
  console.log('ADMIN      → admin@bullandbear.lb      / Admin@123')
  console.log('USER       → user@bullandbear.lb       / User@123')
  console.log('─────────────────────────────────────────')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
