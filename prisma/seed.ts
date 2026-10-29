import { prisma } from '../src/infrastructure/database/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { initialStocks } from './seeds/stocks.data';

async function main() {
  const adminEmail = 'admin@nexbid.com';
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists!');
  } else {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: adminEmail,
        firstName: 'System',
        lastName: 'Admin',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('🎉 Admin user created successfully!');
    console.log('Email: admin@nexbid.com');
    console.log('Password: Admin@123');
  }

  // -------------------------------------------------------------
  // Seed Stock Master Dataset
  // -------------------------------------------------------------
  console.log(`⏳ Seeding ${initialStocks.length} stocks and indices into the stock master...`);

  let seededCount = 0;
  for (const stock of initialStocks) {
    await prisma.stock.upsert({
      where: { symbol: stock.symbol },
      update: {
        name: stock.name,
        exchange: stock.exchange,
        sector: stock.sector,
        type: stock.type,
        isTradable: stock.isTradable,
        isActive: stock.isActive,
      },
      create: {
        id: crypto.randomUUID(),
        symbol: stock.symbol,
        name: stock.name,
        exchange: stock.exchange,
        sector: stock.sector,
        type: stock.type,
        isTradable: stock.isTradable,
        isActive: stock.isActive,
      },
    });
    seededCount++;
  }

  console.log(`✅ Successfully seeded ${seededCount} instruments into the stock master!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
