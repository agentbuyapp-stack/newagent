import cron from "node-cron";
import { processPendingEmails, resetDailyCount } from "./emailService";
import { processExpiredBatches } from "./notificationService";

// Initialize all cron jobs
export const initCronJobs = () => {
  // Reset daily email count at 6:00 AM every day
  // Also process pending emails from previous day
  cron.schedule("0 6 * * *", async () => {
    console.log("[Cron] 6:00 AM - Resetting daily email count and processing pending emails");
    await resetDailyCount();
    await processPendingEmails();
  });

  // Process expired order notification batches every minute
  // This checks if 10 minutes have passed since notifying Top 5 agents
  cron.schedule("* * * * *", async () => {
    await processExpiredBatches();
  });

  // Process pending emails every 5 minutes (if under daily limit)
  cron.schedule("*/5 * * * *", async () => {
    await processPendingEmails();
  });

  console.log("[Cron] All cron jobs initialized");
  console.log("  - Daily email reset: 6:00 AM");
  console.log("  - Expired batch check: Every minute");
  console.log("  - Pending emails: Every 5 minutes");
};
