import { authRouter } from "./auth-router";
import { commissionRouter, draftRouter, messageRouter } from "./commission-router";
import { uploadRouter } from "./upload-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  commission: commissionRouter,
  draft: draftRouter,
  message: messageRouter,
  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;
