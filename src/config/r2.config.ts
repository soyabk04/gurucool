import { S3Client } from "@aws-sdk/client-s3";

export const accountId = process.env.R2_ACCOUNT_ID!;
export const accessKeyId = process.env.R2_ACCESS_KEY!;
export const secretAccessKey = process.env.R2_SECRET_KEY!;

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});


if(!r2Client){
    console.log("err2")
}
export const R2_BUCKET = process.env.R2_BUCKET!;