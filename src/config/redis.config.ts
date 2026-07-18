import { Redis } from "ioredis";
import { redisToken } from "./env.config.js";

export const connection = new Redis(
  `rediss://default:${redisToken}@casual-mammal-175000.upstash.io:6379`,
  {
    maxRetriesPerRequest: null,
  }
);