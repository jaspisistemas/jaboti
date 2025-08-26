import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.pessoa.count({ where: { type: 'USUARIO' } });
  if (count === 0) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.pessoa.create({
      data: {
  user: 'Admin',
        name: 'Admin',
        email: 'admin@local',
        passwordHash,
        role: 'ADMIN',
        type: 'USUARIO',
      },
    });
    console.log('Seed: admin pessoa created (email: admin@local / password: admin123)');
  } else {
    console.log('Seed: pessoa usuarios already exist, skipping');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
