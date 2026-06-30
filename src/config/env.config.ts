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