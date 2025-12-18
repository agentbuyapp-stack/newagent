import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.error("❌ Email оруулах шаардлагатай!");
    console.log("Хэрэглээ: npx ts-node scripts/set-admin-any.ts <email>");
    process.exit(1);
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    if (!user) {
      console.error(`❌ User олдсонгүй: ${email}`);
      console.log("Эхлээд Clerk дээр бүртгүүлэх хэрэгтэй.");
      process.exit(1);
    }
    
    const updatedUser = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { role: "admin" },
    });
    
    console.log(`✅ User ${email} одоо admin боллоо!`);
    console.log(updatedUser);
  } catch (error: any) {
    console.error("❌ Алдаа:", error.message);
    process.exit(1);
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

