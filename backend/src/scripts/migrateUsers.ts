/**
 * Migration script: Update old users (without phone/password) to work with phone+password auth
 *
 * What it does:
 * 1. Finds all users without phone or password
 * 2. Generates a temporary phone number (90000001, 90000002, ...)
 * 3. Sets a temporary password (hashed "temp1a")
 * 4. Admins should update these users with real phone numbers later
 *
 * Run: npx ts-node src/scripts/migrateUsers.ts
 */

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "";

async function migrate() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI not set in .env");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  if (!db) {
    console.error("Database connection not established");
    process.exit(1);
  }
  const usersCollection = db.collection("users");

  // Find users without phone or password
  const oldUsers = await usersCollection
    .find({
      $or: [
        { phone: { $exists: false } },
        { phone: null },
        { phone: "" },
        { password: { $exists: false } },
        { password: null },
        { password: "" },
      ],
    })
    .toArray();

  console.log(`Found ${oldUsers.length} users needing migration`);

  if (oldUsers.length === 0) {
    console.log("No migration needed. All users have phone and password.");
    await mongoose.disconnect();
    return;
  }

  // Temp password - admin should change this later
  const tempPassword = await bcrypt.hash("temp1a", 10);
  let phoneCounter = 90000001;

  // Find max existing temp phone to avoid conflicts
  const maxTempPhone = await usersCollection
    .find({ phone: { $regex: /^9000000\d+$/ } })
    .sort({ phone: -1 })
    .limit(1)
    .toArray();

  if (maxTempPhone.length > 0 && maxTempPhone[0].phone) {
    phoneCounter = parseInt(maxTempPhone[0].phone) + 1;
  }

  let migrated = 0;
  let skipped = 0;

  for (const user of oldUsers) {
    try {
      const updateFields: Record<string, unknown> = {};

      if (!user.phone) {
        updateFields.phone = phoneCounter.toString();
        phoneCounter++;
      }

      if (!user.password) {
        updateFields.password = tempPassword;
      }

      if (!user.orderCredits && user.orderCredits !== 0) {
        updateFields.orderCredits = 0;
      }

      if (!user.researchCards && user.researchCards !== 0) {
        updateFields.researchCards = 0;
      }

      if (Object.keys(updateFields).length > 0) {
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: updateFields }
        );
        console.log(
          `  Migrated: ${user.email || user._id} -> phone: ${updateFields.phone || user.phone}`
        );
        migrated++;
      } else {
        skipped++;
      }
    } catch (err: any) {
      console.error(`  Error migrating ${user.email || user._id}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\nMigration complete:`);
  console.log(`  Migrated: ${migrated} users`);
  console.log(`  Skipped: ${skipped} users`);
  console.log(`\nIMPORTANT: Migrated users have temporary credentials:`);
  console.log(`  Phone: 90000001, 90000002, etc.`);
  console.log(`  Password: temp1a`);
  console.log(`  Admin should update these with real phone numbers.`);

  // Also drop the old unique index on phone if it exists without sparse
  try {
    const indexes = await usersCollection.indexes();
    for (const idx of indexes) {
      if (idx.key && idx.key.phone === 1 && idx.unique && !idx.sparse) {
        console.log(`\nDropping old non-sparse unique index on phone: ${idx.name}`);
        await usersCollection.dropIndex(idx.name!);
        console.log("Old index dropped. New sparse index will be created by Mongoose.");
      }
    }
  } catch (err: any) {
    console.log("Index cleanup note:", err.message);
  }

  await mongoose.disconnect();
  console.log("\nDone!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
