import "dotenv/config";
import connectDB from "../src/lib/mongodb";
import { User } from "../src/models";

async function main() {
  await connectDB();
  const email = process.argv[2];
  
  if (!email) {
    console.error("❌ Email оруулах шаардлагатай!");
    console.log("Хэрэглээ: npx ts-node scripts/set-admin-any.ts <email>");
    process.exit(1);
  }
  
  try {
    const user = await (User as any).findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.error(`❌ User олдсонгүй: ${email}`);
      console.log("Эхлээд Clerk дээр бүртгүүлэх хэрэгтэй.");
      process.exit(1);
    }
    
    const updatedUser = await (User as any).findByIdAndUpdate(
      user._id,
      { role: "admin" },
      { new: true }
    );
    
    if (!updatedUser) {
      console.error(`❌ User шинэчлэхэд алдаа гарлаа: ${email}`);
      process.exit(1);
    }
    
    console.log(`✅ User ${email} одоо admin боллоо!`);
    console.log({
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      role: updatedUser.role,
    });
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
    process.exit(0);
  });
