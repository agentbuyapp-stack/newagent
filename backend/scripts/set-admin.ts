import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "erdenebilegamgalan@gmail.com";
  
  const user = await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { role: "admin" },
  });
  
  console.log(`✅ User ${email} is now an admin!`);
  console.log(user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

