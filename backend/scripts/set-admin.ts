import connectDB from "../src/lib/mongodb";
import { User } from "../src/models";

async function main() {
  await connectDB();
  const email = "erdenebilegamgalan@gmail.com";
  
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { role: "admin" },
    { new: true }
  ).lean();
  
  if (!user) {
    console.error(`❌ User ${email} not found!`);
    process.exit(1);
  }
  
  console.log(`✅ User ${email} is now an admin!`);
  console.log(user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
