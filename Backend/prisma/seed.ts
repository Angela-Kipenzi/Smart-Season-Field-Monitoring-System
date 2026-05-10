// backend/prisma/seed.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DIRECT_URL or DATABASE_URL is not set');
}

const adapter = new PrismaPg(databaseUrl);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartseason.com' },
    update: {},
    create: {
      email: 'admin@smartseason.com',
      password: adminPassword,
      name: 'Admin Coordinator',
      role: 'ADMIN',
    },
  });

  // Create agent user
  const agentPassword = await bcrypt.hash('Agent123!', 10);
  const agent = await prisma.user.upsert({
    where: { email: 'agent@smartseason.com' },
    update: {},
    create: {
      email: 'agent@smartseason.com',
      password: agentPassword,
      name: 'John Agent',
      role: 'AGENT',
    },
  });

  // Create sample fields
  const plantingDate = new Date();
  plantingDate.setDate(plantingDate.getDate() - 25); // 25 days ago

  const field1 = await prisma.field.create({
    data: {
      name: 'North Field',
      cropType: 'Corn',
      plantingDate: plantingDate,
      currentStage: 'GROWING',
      agentId: agent.id,
    },
  });

  const field2 = await prisma.field.create({
    data: {
      name: 'South Field',
      cropType: 'Wheat',
      plantingDate: new Date(2024, 0, 15),
      currentStage: 'READY',
      agentId: agent.id,
    },
  });

  const field3 = await prisma.field.create({
    data: {
      name: 'East Field',
      cropType: 'Soybeans',
      plantingDate: new Date(2024, 2, 10),
      currentStage: 'PLANTED',
      agentId: null,
    },
  });

  // Create sample updates
  await prisma.update.create({
    data: {
      fieldId: field1.id,
      stage: 'GROWING',
      notes: 'Crops are showing good growth. Height approximately 30cm.',
      updatedBy: agent.id,
    },
  });

  await prisma.update.create({
    data: {
      fieldId: field2.id,
      stage: 'READY',
      notes: 'Crops are ready for harvest. Planning to harvest next week.',
      updatedBy: agent.id,
    },
  });

  console.log('Seed completed!');
  console.log('Admin credentials: admin@smartseason.com / Admin123!');
  console.log('Agent credentials: agent@smartseason.com / Agent123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
