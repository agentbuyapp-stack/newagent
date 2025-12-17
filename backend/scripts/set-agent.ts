import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Set agent role for vildwergbu@gmail.com
  const email = "vildwergbu@gmail.com";

  const user = await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { 
      role: "agent",
      isApproved: false, // Not approved yet, will show in pending agents
    },
  });

  console.log(`✅ User ${email} is now an agent!`);
  console.log(`User ID: ${user.id}`);
  console.log(`Role: ${user.role}`);
  console.log(`isApproved: ${user.isApproved}`);
  console.log(`\nThis agent will appear in "Хүлээж байгаа Agents" section on admin dashboard.`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

