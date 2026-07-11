import { Worker } from "bullmq";
import { connection } from "../config/redis.config.js";
import { sendWelcomeEmail } from "../utils/sendemail.js"; // Change this path

export const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    const { newUser,pass,orgName } = job.data;


    await sendWelcomeEmail(
      newUser,pass,orgName
    );

    console.log(` Email sent to ${newUser.email}`);
  },
  {
    connection,
  }
);

emailWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed`, err);
});