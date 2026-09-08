import { Worker } from "bullmq";
import { connection } from "../config/redis.config.js";
import { sendWelcomeEmail ,sendForgetPasswordEmail,sendChapterUnlockedEmail} from "../utils/sendemail.js"; // Change this path

export const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    const { user, password, organization } = job.data;
    console.log(`Processing job ${job.id} for user ${user.email}`);

    await sendWelcomeEmail(user, password, organization);

    console.log(` Email sent to ${user.email}`);
  },
  { connection }
);


export const NotificationWorker = new Worker(
  "email",
  async (job) => {

    switch (job.name) {

      case "chapter-unlocked": {
        const {
          recipient,
          name,
          chapterTitle,
          courseName,
          domain,
        } = job.data;

        await sendChapterUnlockedEmail(
          {
            name,
            email: recipient,
          },
          {
            title: chapterTitle,
            courseName,
          },
          domain
        );

        break;
      }

      default:
        throw new Error(`Unknown email job: ${job.name}`);
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

emailWorker.on("completed", (job) => {
  console.log(`✅ Email job ${job.id} completed`);
});

emailWorker.on("failed", (job, error) => {
  console.error(
    `❌ Email job ${job?.id} failed:`,
    error.message
  );
});

emailWorker.on("error", (error) => {
  console.error("❌ Email worker error:", error);
});

export const forgotPasswordWorker = new Worker(
  "passwordResetQueue",
  async (job) => {
    const { user,resetLink } = job.data;
    console.log(resetLink)
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