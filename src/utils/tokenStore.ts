import { connection } from "../config/redis.config.js";

const REVOKED_PREFIX = "revoked-refresh-token:";

/**
 * Marks a refresh token's jti as revoked until it would have expired
 * naturally. Used on logout so a stolen/old refresh token can no longer be
 * exchanged for a new access token, even though JWTs themselves can't be
 * "deleted" once issued.
 */
export const revokeToken = async (jti: string, ttlSeconds: number) => {
  if (!jti || ttlSeconds <= 0) return;
  await connection.set(`${REVOKED_PREFIX}${jti}`, "1", "EX", ttlSeconds);
};

export const isTokenRevoked = async (jti: string): Promise<boolean> => {
  if (!jti) return false;
  const value = await connection.get(`${REVOKED_PREFIX}${jti}`);
  return value !== null;
};
