import { prisma } from '../src/infrastructure/database/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

async function main() {
  const adminEmail = 'admin@nexbid.com';
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists!');
    return;
  }

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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
