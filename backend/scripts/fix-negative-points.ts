import mongoose from "mongoose";
import "../src/models/User";

async function fixNegativePoints() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/agentbuy";
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB");

        // Get User model
        const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}, { collection: "users" }));

        // Update all negative points to 0
        const result = await User.updateMany(
            { agentPoints: { $lt: 0 } },
            { $set: { agentPoints: 0 } }
        );

        console.log(`Updated ${result.modifiedCount} users with negative points to 0`);
        if (result.modifiedCount > 0) {
            console.log("✅ All negative points have been set to 0");
        } else {
            console.log("ℹ️ No users with negative points found");
        }

        // Close connection
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    } catch (error) {
        console.error("Error fixing negative points:", error);
        process.exit(1);
    }
}

fixNegativePoints();

