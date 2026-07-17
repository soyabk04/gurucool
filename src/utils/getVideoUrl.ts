import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client } from "../config/r2.config.js";

export const getVideoStreamUrl = async (key: string) => {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
  });

  return await getSignedUrl(r2Client, command, {
    expiresIn: 60 * 60, // 1 hour
  });
};