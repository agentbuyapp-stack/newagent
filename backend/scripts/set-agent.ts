import connectDB from "../src/lib/mongodb";
import { User } from "../src/models";

async function main() {
  await connectDB();
  // Set agent role for vildwergbu@gmail.com
  const email = "vildwergbu@gmail.com";

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { 
      role: "agent",
      isApproved: false, // Not approved yet, will show in pending agents
    },
    { new: true }
  ).lean();

  if (!user) {
    console.error(`❌ User ${email} not found!`);
    process.exit(1);
  }

  console.log(`✅ User ${email} is now an agent!`);
  console.log(`User ID: ${user._id.toString()}`);
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
    process.exit(0);
  });
