import { Worker } from "bullmq";
import { connection } from "../config/redis.config.js";
import { sendWelcomeEmail ,sendForgetPasswordEmail} from "../utils/sendemail.js"; // Change this path

export const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    const { user,password,organization } = job.data;
    console.log(`Processing job ${job.id} for user ${user.email}`);
  
    await sendWelcomeEmail(
      user,password,organization
    );

    console.log(` Email sent to ${user.email}`);
  },
  {
    connection,
  }
);

export const forgotPasswordWorker = new Worker(
  "emailQueue",
  async (job) => {
    const { user,resetLink } = job.data;
    console.log(`Processing job ${job.id} for user ${user.email}`);
  
    await sendForgetPasswordEmail(
      user,resetLink
    );

    console.log(` Email sent to ${user.email}`);
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