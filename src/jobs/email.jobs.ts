import { emailQueue, passwordResetQueue } from "../queue/email.queue.js";

export async function sendWelcomeEmail(data: {
    email: string;
    name: string;
}) {
    await emailQueue.add("welcome-email", data);
}
export async function sendForgetPasswordEmailQueue(data: {
    email: string;
    resetLink: string;
}) {
    await passwordResetQueue.add("forget-password-email", data);
}