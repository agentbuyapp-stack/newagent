import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "erdenebilegamgalan@gmail.com";

  // First, make sure user is an agent
  let user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    console.error(`❌ User ${email} not found!`);
    process.exit(1);
  }

  if (user.role !== "agent") {
    console.log(`⚠️  User ${email} is not an agent. Setting role to agent...`);
    user = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { role: "agent" },
    });
  }

  // Approve the agent
  const approvedAgent = await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: {
      isApproved: true,
      approvedAt: new Date(),
      approvedBy: user.id, // Self-approved for now
    },
  });

  console.log(`✅ Agent ${email} is now approved!`);
  console.log(`User ID: ${approvedAgent.id}`);
  console.log(`Role: ${approvedAgent.role}`);
  console.log(`Is Approved: ${approvedAgent.isApproved}`);
  console.log(`Approved At: ${approvedAgent.approvedAt}`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

