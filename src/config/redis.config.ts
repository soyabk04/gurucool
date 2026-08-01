import { Redis } from "ioredis";
import { redisUrl } from "./env.config.js";

let attempts = 0;

export const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,

  retryStrategy() {
    attempts++;

    if (attempts > 5) {
      console.error("Too many retries. Exiting...");
      return null;
    }

    return 2000; // Retry every 2 seconds
  },
});

connection.on("error", (err: any) => {
  if (err.message.includes("WRONGPASS")) {
    console.error("Invalid Redis credentials");
    process.exit(1);
  }
});

connection.on("ready", () => {
  console.log("🚀 Redis ready");
});

connection.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

connection.on("close", () => {
  console.log("🔌 Redis connection closed");
});