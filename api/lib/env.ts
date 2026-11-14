import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL?.trim() || "";
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim() || "";
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim() || "";
const s3Bucket = process.env.S3_BUCKET?.trim() || "";

export const env = {
  appId: process.env.APP_ID?.trim() || "editorial-commission-desk",
  appSecret:
    process.env.APP_SECRET?.trim() || "editorial-commission-desk-default-secret-2026",
  isProduction: process.env.NODE_ENV === "production",
  enableDemoSandbox: process.env.ENABLE_DEMO_SANDBOX !== "false",
  databaseUrl,
  hasDatabase: Boolean(databaseUrl),
  kimiAuthUrl: process.env.KIMI_AUTH_URL?.trim() || "",
  kimiOpenUrl: process.env.KIMI_OPEN_URL?.trim() || "",
  ownerUnionId: process.env.OWNER_UNION_ID?.trim() || "demo-admin",
  awsRegion: process.env.AWS_REGION?.trim() || "us-east-1",
  awsAccessKeyId,
  awsSecretAccessKey,
  s3Bucket,
  hasS3: Boolean(awsAccessKeyId && awsSecretAccessKey && s3Bucket),
};
