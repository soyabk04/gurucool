import { randomInt } from "crypto";

export const generatePassword = (
  length: number = 12
): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let password = "";

  for (let i = 0; i < length; i++) {
    password += chars.charAt(randomInt(0, chars.length));
  }

  return password;
};