import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: process.env.NEXT_AWS_S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.NEXT_AWS_S3_ACCESS_KEY_ID || "mock-access-key-id",
    secretAccessKey:
      process.env.NEXT_AWS_S3_SECRET_ACCESS_KEY || "mock-secret-access-key",
  },
});
