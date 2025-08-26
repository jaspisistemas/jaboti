import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Backfilling usernames (Pessoa.PesUsr) for USUARIO with null/empty user...');
  // 1) Ensure Admin has exact username 'Admin' if present
  await prisma.$executeRawUnsafe(`
    UPDATE "Pessoa"
       SET "PesUsr" = 'Admin'
     WHERE "PesTip" = 'USUARIO'
       AND ("PesUsr" IS NULL OR "PesUsr" = '')
       AND "PesNom" = 'Admin';
  `);

  // 2) For any remaining USUARIO without username, set a unique, deterministic value based on name + id
  //    e.g., "john_doe_123" or fallback to "user_123" when name is null/empty
  await prisma.$executeRawUnsafe(`
    UPDATE "Pessoa" p
       SET "PesUsr" = CASE
         WHEN COALESCE("PesNom", '') = '' THEN CONCAT('user_', "PesCod")
         ELSE CONCAT("PesNom", '_', "PesCod")
       END
     WHERE "PesTip" = 'USUARIO'
       AND ("PesUsr" IS NULL OR "PesUsr" = '');
  `);

  const remaining: Array<{ count: bigint }> = await prisma.$queryRawUnsafe(
    `SELECT COUNT(1)::bigint AS count FROM "Pessoa" WHERE "PesTip"='USUARIO' AND ("PesUsr" IS NULL OR "PesUsr" = '')`
  );
  console.log('Remaining without username:', remaining?.[0]?.count?.toString?.() ?? 'unknown');
}

run()
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
