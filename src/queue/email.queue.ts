import { Queue } from "bullmq";
import { connection } from "../config/redis.config.js";

export const emailQueue = new Queue("email", {
  connection,
  defaultJobOptions: {
    attempts: 3,

    backoff: {
      type: "exponential",
      delay: 5000,
    },

    removeOnComplete: {
      age: 60 * 60 * 24, // 24 hours
      count: 1000,
    },

    removeOnFail: {
      age: 60 * 60 * 24 * 7, // 7 days
    },
  },
});
export const passwordResetQueue = new Queue("passwordResetQueue", {
  connection,
});