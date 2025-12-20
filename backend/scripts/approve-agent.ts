import connectDB from "../src/lib/mongodb";
import { User } from "../src/models";

async function main() {
  await connectDB();
  const email = "erdenebilegamgalan@gmail.com";

  // First, make sure user is an agent
  let user = await User.findOne({ email: email.toLowerCase() }).lean();

  if (!user) {
    console.error(`❌ User ${email} not found!`);
    process.exit(1);
  }

  if (user.role !== "agent") {
    console.log(`⚠️  User ${email} is not an agent. Setting role to agent...`);
    await User.findByIdAndUpdate(user._id, { role: "agent" });
    user = await User.findById(user._id).lean();
  }

  // Approve the agent
  const approvedAgent = await User.findByIdAndUpdate(
    user._id,
    {
      isApproved: true,
      approvedAt: new Date(),
      approvedBy: user._id.toString(), // Self-approved for now
    },
    { new: true }
  ).lean();

  console.log(`✅ Agent ${email} is now approved!`);
  console.log(`User ID: ${approvedAgent!._id.toString()}`);
  console.log(`Role: ${approvedAgent!.role}`);
  console.log(`Is Approved: ${approvedAgent!.isApproved}`);
  console.log(`Approved At: ${approvedAgent!.approvedAt}`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
