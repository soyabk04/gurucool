import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "../config/r2.config.js";

export class R2Service {
  static async upload(file: Express.Multer.File, key: string) {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    return key;
  }
}