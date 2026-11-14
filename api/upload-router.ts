import { z } from "zod";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { env } from "./lib/env";
import { authedQuery, createRouter, publicQuery } from "./middleware";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
]);

function sanitizeFileName(name: string): string {
  return (
    name
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "reference-asset"
  );
}

export const uploadRouter = createRouter({
  status: publicQuery.query(() => ({
    mode: env.hasS3 ? ("s3" as const) : ("inline" as const),
  })),

  presignOrInline: authedQuery
    .input(
      z.object({
        fileName: z.string().min(1).max(200),
        contentType: z.string().min(1).max(120),
        dataUrl: z.string().max(4_000_000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ALLOWED_TYPES.has(input.contentType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Unsupported file type. Upload PNG, JPG, WEBP, GIF, SVG, or PDF.",
        });
      }

      const safeName = sanitizeFileName(input.fileName);
      const key = `commissions/${ctx.user.id}/${nanoid(10)}-${safeName}`;

      if (env.hasS3) {
        const client = new S3Client({
          region: env.awsRegion,
          credentials: {
            accessKeyId: env.awsAccessKeyId,
            secretAccessKey: env.awsSecretAccessKey,
          },
        });
        const command = new PutObjectCommand({
          Bucket: env.s3Bucket,
          Key: key,
          ContentType: input.contentType,
        });
        const uploadUrl = await getSignedUrl(client, command, {
          expiresIn: 300,
        });
        const publicUrl = `https://${env.s3Bucket}.s3.${env.awsRegion}.amazonaws.com/${key}`;
        return {
          mode: "s3" as const,
          uploadUrl,
          publicUrl,
          key,
          fileName: safeName,
          contentType: input.contentType,
        };
      }

      let safeInlineUrl = `reference://${key}`;
      if (input.dataUrl) {
        const expectedPrefix = `data:${input.contentType};base64,`;
        const isValidSvgUtf8 =
          input.contentType === "image/svg+xml" &&
          input.dataUrl.startsWith("data:image/svg+xml;charset=utf-8,");
        if (!input.dataUrl.startsWith(expectedPrefix) && !isValidSvgUtf8) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Uploaded data URL does not match declared file content type.",
          });
        }
        if (input.contentType === "image/svg+xml") {
          const rawPayload = input.dataUrl.startsWith(expectedPrefix)
            ? Buffer.from(input.dataUrl.slice(expectedPrefix.length), "base64").toString("utf8")
            : decodeURIComponent(input.dataUrl.slice("data:image/svg+xml;charset=utf-8,".length));
          if (/<script\b|\bon\w+\s*=|javascript:|<foreignObject\b/i.test(rawPayload)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Active scripts or event handlers are not allowed inside SVG uploads.",
            });
          }
        }
        safeInlineUrl = input.dataUrl;
      }

      return {
        mode: "inline" as const,
        uploadUrl: null,
        publicUrl: safeInlineUrl,
        key,
        fileName: safeName,
        contentType: input.contentType,
      };
    }),
});
