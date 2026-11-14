import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import { env } from "./lib/env";
import { resetMemoryStore } from "./queries/memory-store";
import {
  findCommissionsByUser,
  findAllCommissions,
  findCommissionById,
  createCommission,
  updateCommissionStatus,
  findDraftsByUser,
  findDraftById,
  createDraft,
  updateDraft,
  deleteDraft,
  findMessagesByUser,
  findMessagesByCommission,
  findAllMessages,
  createMessage,
  getCommissionWorkspace,
  getAllWorkspacesSummary,
  findPinById,
  addProofPin,
  toggleProofPinResolved,
  addDeliverable,
  requestCommissionRevision,
  payCommissionMilestone,
  recordCommissionAudit,
} from "./queries/commissions";

async function requireCommissionAccess(
  user: { id: number; role: string },
  commissionId: number,
) {
  const commission = await findCommissionById(commissionId);
  if (!commission) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Commission not found",
    });
  }
  if (commission.userId !== user.id && user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied",
    });
  }
  return commission;
}

async function requireDraftAccess(
  user: { id: number; role: string },
  draftId: number,
) {
  const draft = await findDraftById(draftId);
  if (!draft) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Draft not found",
    });
  }
  if (draft.userId !== user.id && user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied",
    });
  }
  return draft;
}

export const commissionRouter = createRouter({
  list: authedQuery.query(({ ctx }) =>
    findCommissionsByUser(ctx.user.id),
  ),

  listAll: adminQuery.query(() => findAllCommissions()),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => requireCommissionAccess(ctx.user, input.id)),

  create: authedQuery
    .input(
      z.object({
        projectType: z.string().min(1),
        deliverables: z.string().min(1),
        deadline: z.string().min(1),
        budget: z.string().min(1),
        rightsUsage: z.string().min(1),
        visualReferences: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      createCommission({ ...input, userId: ctx.user.id }),
    ),

  updateStatus: adminQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum([
          "submitted",
          "in_review",
          "approved",
          "in_progress",
          "delivered",
          "completed",
          "cancelled",
        ]),
      }),
    )
    .mutation(({ input }) =>
      updateCommissionStatus(input.id, input.status),
    ),

  cancel: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const commission = await findCommissionById(input.id);
      if (!commission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Commission not found",
        });
      }
      if (commission.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to cancel this commission",
        });
      }
      if (
        commission.status !== "submitted" &&
        commission.status !== "in_review"
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only submitted or in-review inquiries can be cancelled",
        });
      }
      return updateCommissionStatus(input.id, "cancelled");
    }),

  approveDelivery: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const commission = await findCommissionById(input.id);
      if (!commission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Commission not found",
        });
      }
      if (commission.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to approve delivery for this commission",
        });
      }
      if (commission.status !== "delivered") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only delivered commissions can be approved as completed",
        });
      }
      const updated = await updateCommissionStatus(input.id, "completed");
      await createMessage({
        userId: commission.userId,
        commissionId: commission.id,
        senderType: ctx.user.role === "admin" ? "studio" : "client",
        content: `Delivery signed off by ${ctx.user.name || "Client"} — Commission #${commission.id} marked as Completed.`,
      });
      recordCommissionAudit({
        commissionId: commission.id,
        actorName: ctx.user.name || (ctx.user.role === "admin" ? "Atelier Mondrian" : "Client"),
        actorRole: ctx.user.role === "admin" ? "studio" : "client",
        action: "Final Delivery Signed Off",
        detail: "Commission officially approved and transitioned to Completed.",
      });
      return updated;
    }),

  workspaceById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const workspace = await getCommissionWorkspace(input.id);
      if (!workspace) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Commission workspace not found",
        });
      }
      return workspace;
    }),

  workspacesOverview: authedQuery.query(async ({ ctx }) => {
    const list =
      ctx.user.role === "admin"
        ? await findAllCommissions()
        : await findCommissionsByUser(ctx.user.id);
    return getAllWorkspacesSummary(list.map((c) => c.id));
  }),

  addPin: authedQuery
    .input(
      z.object({
        commissionId: z.number(),
        deliverableId: z.number(),
        xPercent: z.number().min(0).max(100),
        yPercent: z.number().min(0).max(100),
        comment: z.string().min(1).max(600),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const commission = await findCommissionById(input.commissionId);
      if (!commission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Commission not found",
        });
      }
      if (commission.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to annotate this proof",
        });
      }
      return addProofPin({
        ...input,
        authorName:
          ctx.user.name ||
          (ctx.user.role === "admin" ? "Atelier Mondrian" : "Client"),
        authorRole: ctx.user.role === "admin" ? "studio" : "client",
      });
    }),

  togglePinResolved: authedQuery
    .input(z.object({ pinId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existingPin = await findPinById(input.pinId);
      if (!existingPin) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proof pin not found",
        });
      }
      await requireCommissionAccess(ctx.user, existingPin.commissionId);
      const updated = await toggleProofPinResolved(
        input.pinId,
        ctx.user.name ||
          (ctx.user.role === "admin" ? "Atelier Mondrian" : "Client"),
        ctx.user.role === "admin" ? "studio" : "client",
      );
      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proof pin not found",
        });
      }
      return updated;
    }),

  uploadDeliverable: adminQuery
    .input(
      z.object({
        commissionId: z.number(),
        versionLabel: z.string().min(1).max(120),
        stage: z.enum(["wireframe", "color_study", "final_press"]),
        imageUrl: z.string().min(1),
        fileFormat: z.string().min(1).max(120),
        notes: z.string().max(600).default(""),
        lockedUntilPaid: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const commission = await findCommissionById(input.commissionId);
      if (!commission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Commission not found",
        });
      }
      return addDeliverable(input, ctx.user.name || "Atelier Mondrian");
    }),

  requestRevision: authedQuery
    .input(
      z.object({
        commissionId: z.number(),
        notes: z.string().min(1).max(800),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const commission = await findCommissionById(input.commissionId);
      if (!commission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Commission not found",
        });
      }
      if (commission.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to request revisions on this commission",
        });
      }
      return requestCommissionRevision({
        commissionId: input.commissionId,
        notes: input.notes,
        actorName:
          ctx.user.name ||
          (ctx.user.role === "admin" ? "Atelier Mondrian" : "Client"),
        actorRole: ctx.user.role === "admin" ? "studio" : "client",
        userId: commission.userId,
      });
    }),

  payMilestone: authedQuery
    .input(
      z.object({
        commissionId: z.number(),
        milestoneId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const commission = await findCommissionById(input.commissionId);
      if (!commission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Commission not found",
        });
      }
      if (commission.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to pay invoices for this commission",
        });
      }
      const res = await payCommissionMilestone(
        input.milestoneId,
        ctx.user.name || "Client",
      );
      if (!res.milestone) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Milestone invoice not found",
        });
      }
      return res;
    }),

  resetDemo: authedQuery.mutation(() => {
    if (!env.enableDemoSandbox) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Demo sandbox reset is disabled",
      });
    }
    resetMemoryStore();
    return { ok: true };
  }),
});

export const draftRouter = createRouter({
  list: authedQuery.query(({ ctx }) => findDraftsByUser(ctx.user.id)),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => requireDraftAccess(ctx.user, input.id)),

  create: authedQuery
    .input(
      z.object({
        projectType: z.string().optional(),
        deliverables: z.string().optional(),
        deadline: z.string().optional(),
        budget: z.string().optional(),
        rightsUsage: z.string().optional(),
        visualReferences: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      createDraft({ ...input, userId: ctx.user.id }),
    ),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        projectType: z.string().optional(),
        deliverables: z.string().optional(),
        deadline: z.string().optional(),
        budget: z.string().optional(),
        rightsUsage: z.string().optional(),
        visualReferences: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireDraftAccess(ctx.user, input.id);
      const { id, ...data } = input;
      return updateDraft(id, data);
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await requireDraftAccess(ctx.user, input.id);
      return deleteDraft(input.id);
    }),
});

export const messageRouter = createRouter({
  list: authedQuery.query(({ ctx }) => findMessagesByUser(ctx.user.id)),

  listAll: adminQuery.query(() => findAllMessages()),

  byCommission: authedQuery
    .input(z.object({ commissionId: z.number() }))
    .query(async ({ ctx, input }) => {
      await requireCommissionAccess(ctx.user, input.commissionId);
      return findMessagesByCommission(input.commissionId);
    }),

  create: authedQuery
    .input(
      z.object({
        commissionId: z.number().optional(),
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.commissionId !== undefined) {
        await requireCommissionAccess(ctx.user, input.commissionId);
      }
      return createMessage({
        ...input,
        userId: ctx.user.id,
        senderType: "client",
      });
    }),

  studioReply: adminQuery
    .input(
      z.object({
        userId: z.number(),
        commissionId: z.number().optional(),
        content: z.string().min(1),
      }),
    )
    .mutation(({ input }) =>
      createMessage({
        ...input,
        senderType: "studio",
      }),
    ),
});
