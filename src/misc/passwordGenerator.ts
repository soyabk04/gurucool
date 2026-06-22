export const generatePassword = (
  length: number = 8
): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let password = "";

  for (let i = 0; i < length; i++) {
    password += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return password;
};