import { Redis } from "ioredis";
import { redisHost } from "./env.config.js";

let attempts = 0;


export const connection = new Redis(redisHost, {
  maxRetriesPerRequest: null,

  retryStrategy(times) {
    attempts = times;

    if (attempts > 5) {
      console.error("Too many Redis retries. Stopping retries...");
      return null;
    }

    console.log(`Redis retry ${attempts}/5...`);

    return 2000;
  },
});

connection.on("ready", () => {
  attempts = 0;
  console.log("🚀 Redis ready");
});

connection.on("error", (err: Error) => {
  if (err.message?.includes("WRONGPASS")) {
    console.error("❌ Invalid Redis credentials");
    process.exit(1);
  }

  console.error("❌ Redis error:", err.message);
});

connection.on("close", () => {
  console.log("🔌 Redis connection closed");
});