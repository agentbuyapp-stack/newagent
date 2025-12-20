import connectDB from "../src/lib/mongodb";
import { User, Profile } from "../src/models";

async function checkAgents() {
  await connectDB();
  try {
    console.log("Checking for agents in database...");
    
    // Get all users
    const allUsers = await User.find()
      .sort({ createdAt: -1 })
      .lean();
    
    const usersWithProfiles = await Promise.all(
      allUsers.map(async (user) => {
        const profile = await Profile.findOne({ userId: user._id }).lean();
        return { ...user, profile };
      })
    );
    
    console.log(`\nTotal users in database: ${usersWithProfiles.length}`);
    console.log("\nAll users:");
    usersWithProfiles.forEach((user) => {
      console.log(`- Email: ${user.email}, Role: ${user.role}, isApproved: ${user.isApproved}`);
    });
    
    // Get only agent users
    const agents = await User.find({ role: "agent" })
      .sort({ createdAt: -1 })
      .lean();
    
    const agentsWithProfiles = await Promise.all(
      agents.map(async (agent) => {
        const profile = await Profile.findOne({ userId: agent._id }).lean();
        return { ...agent, profile };
      })
    );
    
    console.log(`\n\nTotal agents in database: ${agentsWithProfiles.length}`);
    if (agentsWithProfiles.length > 0) {
      console.log("\nAgents:");
      agentsWithProfiles.forEach((agent) => {
        console.log(`- Email: ${agent.email}, isApproved: ${agent.isApproved}, Profile: ${agent.profile ? "Yes" : "No"}`);
      });
    } else {
      console.log("\nNo agents found in database!");
      console.log("To create an agent, use: npx tsx scripts/set-agent.ts");
    }
    
  } catch (error) {
    console.error("Error checking agents:", error);
  } finally {
    process.exit(0);
  }
}

checkAgents();
