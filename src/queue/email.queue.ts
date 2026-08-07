import { Queue } from "bullmq";
import { connection } from "../config/redis.config.js";

export const emailQueue = new Queue("emailQueue", {
  connection,
});
export const passwordResetQueue = new Queue("passwordResetQueue", {
  connection,
});