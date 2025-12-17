import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAgents() {
  try {
    console.log("Checking for agents in database...");
    
    // Get all users
    const allUsers = await prisma.user.findMany({
      include: { profile: true },
      orderBy: { createdAt: "desc" },
    });
    
    console.log(`\nTotal users in database: ${allUsers.length}`);
    console.log("\nAll users:");
    allUsers.forEach((user) => {
      console.log(`- Email: ${user.email}, Role: ${user.role}, isApproved: ${user.isApproved}`);
    });
    
    // Get only agent users
    const agents = await prisma.user.findMany({
      where: { role: "agent" },
      include: { profile: true },
      orderBy: { createdAt: "desc" },
    });
    
    console.log(`\n\nTotal agents in database: ${agents.length}`);
    if (agents.length > 0) {
      console.log("\nAgents:");
      agents.forEach((agent) => {
        console.log(`- Email: ${agent.email}, isApproved: ${agent.isApproved}, Profile: ${agent.profile ? "Yes" : "No"}`);
      });
    } else {
      console.log("\nNo agents found in database!");
      console.log("To create an agent, use: npx tsx scripts/set-agent.ts");
    }
    
  } catch (error) {
    console.error("Error checking agents:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAgents();

