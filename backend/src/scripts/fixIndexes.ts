/**
 * Fix MongoDB indexes for the User collection
 * Drops old non-sparse unique indexes and lets Mongoose recreate them with sparse option
 *
 * Run: npx ts-node src/scripts/fixIndexes.ts
 */

import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

async function fixIndexes() {
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

  // List current indexes
  const indexes = await usersCollection.indexes();
  console.log("\nCurrent indexes:");
  for (const idx of indexes) {
    console.log(`  ${idx.name}: ${JSON.stringify(idx.key)} unique=${idx.unique || false} sparse=${idx.sparse || false}`);
  }

  // Drop problematic indexes (unique but not sparse on phone)
  for (const idx of indexes) {
    if (idx.name === "_id_") continue;

    if (idx.key && idx.key.phone === 1 && idx.unique && !idx.sparse) {
      console.log(`\nDropping non-sparse unique index on phone: ${idx.name}`);
      await usersCollection.dropIndex(idx.name!);
      console.log("Dropped successfully");
    }
  }

  // Create new sparse unique index on phone
  try {
    await usersCollection.createIndex({ phone: 1 }, { unique: true, sparse: true });
    console.log("Created new sparse unique index on phone");
  } catch (err: any) {
    if (err.code === 85 || err.code === 86) {
      console.log("Phone index already exists with correct options");
    } else {
      console.error("Error creating phone index:", err.message);
    }
  }

  // List updated indexes
  const updatedIndexes = await usersCollection.indexes();
  console.log("\nUpdated indexes:");
  for (const idx of updatedIndexes) {
    console.log(`  ${idx.name}: ${JSON.stringify(idx.key)} unique=${idx.unique || false} sparse=${idx.sparse || false}`);
  }

  await mongoose.disconnect();
  console.log("\nDone!");
}

fixIndexes().catch((err) => {
  console.error("Fix indexes failed:", err);
  process.exit(1);
});
