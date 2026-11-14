import * as cookie from "cookie";
import { z } from "zod";
import { Session } from "@contracts/constants";
import { TRPCError } from "@trpc/server";
import { env } from "./lib/env";
import { getSessionCookieOptions } from "./lib/cookies";
import { signSessionToken } from "./kimi/session";
import { upsertUser } from "./queries/users";
import { createRouter, authedQuery, publicQuery } from "./middleware";

const DEMO_PRESETS = {
  user: {
    unionId: "demo-client",
    name: "Clara Vance (The New Yorker)",
    email: "clara.vance@newyorker-editorial.com",
    role: "user" as const,
  },
  admin: {
    unionId: "demo-admin",
    name: "Atelier Mondrian (Studio Desk)",
    email: "desk@editorialcommission.studio",
    role: "admin" as const,
  },
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "guest";
}

export const authRouter = createRouter({
  me: publicQuery.query((opts) => opts.ctx.user ?? null),

  demoLogin: publicQuery
    .input(
      z.object({
        role: z.enum(["user", "admin"]).default("user"),
        name: z.string().optional(),
        email: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!env.enableDemoSandbox) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Demo sandbox sign-in is disabled",
        });
      }
      const preset = DEMO_PRESETS[input.role];
      const customName = input.name?.trim();
      const customEmail = input.email?.trim();
      const hasCustomProfile = Boolean(customName || customEmail);

      const unionId = hasCustomProfile
        ? `custom-${input.role}-${slugify(customEmail || customName || "guest")}`
        : preset.unionId;

      const user = await upsertUser({
        unionId,
        name: customName || preset.name,
        email: customEmail || preset.email,
        role: input.role,
        lastSignInAt: new Date(),
      });

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to initialize demo session",
        });
      }

      const token = await signSessionToken({
        unionId: user.unionId,
        clientId: env.appId,
      });

      const opts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          httpOnly: opts.httpOnly,
          path: opts.path,
          sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
          secure: opts.secure,
          maxAge: Session.maxAgeMs / 1000,
        }),
      );

      return user;
    }),

  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),
});
