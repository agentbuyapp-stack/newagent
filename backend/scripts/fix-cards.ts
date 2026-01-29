import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import "../src/models/User";

async function fixCards() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/agentbuy";
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB");

        // Get User model
        const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}, { collection: "users" }));

        // First, show users with 10 cards
        const usersWithTenCards = await User.find({ researchCards: 10 }).select("email researchCards").lean();
        console.log(`Found ${usersWithTenCards.length} users with 10 cards:`);
        usersWithTenCards.forEach((u: any) => console.log(`  - ${u.email}: ${u.researchCards} cards`));

        // Update all users with 10 cards to 5 cards
        const result = await User.updateMany(
            { researchCards: 10 },
            { $set: { researchCards: 5 } }
        );

        console.log(`Updated ${result.modifiedCount} users from 10 cards to 5 cards`);
        if (result.modifiedCount > 0) {
            console.log("✅ All users with 10 cards have been set to 5 cards");
        } else {
            console.log("ℹ️ No users with 10 cards found");
        }

        // Close connection
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    } catch (error) {
        console.error("Error fixing cards:", error);
        process.exit(1);
    }
}

fixCards();
