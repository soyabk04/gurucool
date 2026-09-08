import { emailQueue, passwordResetQueue,notificationQueue } from "../queue/email.queue.js";

export async function sendWelcomeEmail(data: {
    email: string;
    name: string;
}) {
    await emailQueue.add("welcome-email", data);
}
export async function sendForgetPasswordEmailQueue(data: {
    user: any;
    resetLink: string;
}) {
    await passwordResetQueue.add("forget-password-email", data);
}
export async function sendChapterUnlockedNotification(data: {
  recipient: string;
  subject: string;
  message: string;
  isHtml?: boolean;
}) {
  await notificationQueue.add("chapter-unlocked", data);
}
