// prisma/delete-user.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.delete({
    where: { email: 'Seyhmus@tintebilisim.com' },
  });
  console.log('Kullanıcı silindi');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
