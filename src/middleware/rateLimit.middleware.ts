// middleware/rateLimiter.ts
import rateLimit from "express-rate-limit";

export const createRateLimiter = (
  max: number,
  minutes: number,
  message = "Too many requests."
) =>
  rateLimit({
    windowMs: minutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
  });