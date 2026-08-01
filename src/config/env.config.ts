import dotenv from "dotenv";

dotenv.config();

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const gmailId = getEnv("GMAILID");
export const port = getEnv("PORT");
export const version = getEnv("VERSION");
export const gmailPass = getEnv("GMAILPASS");
export const mongoUrl = getEnv("MONGOURL");
export const ATJWTKEY = getEnv("ATJWTKEY");
export const RTJWTKEY = getEnv("RTJWTKEY");
export const redisHost = getEnv("REDIS_HOST");
export const redisToken = getEnv("REDIS_TOKEN");
export const redisPort = process.env.REDIS_PORT ?? "6379";

/** Prefer REDIS_URL; otherwise build from REDIS_HOST + REDIS_TOKEN (+ REDIS_PORT). */
export const redisUrl =
  `rediss://default:${redisToken}@casual-mammal-175000.upstash.io:6379`