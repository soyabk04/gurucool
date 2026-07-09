import { emailQueue } from "../queue/email.queue.js";

export async function sendWelcomeEmail(data: {
    email: string;
    name: string;
}) {
    await emailQueue.add("welcome-email", data);
}