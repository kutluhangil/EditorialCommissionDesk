import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import {
  findCommissionsByUser,
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
  createMessage,
} from "./queries/commissions";

export const commissionRouter = createRouter({
  list: authedQuery.query(({ ctx }) =>
    findCommissionsByUser(ctx.user.id),
  ),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) =>
      findCommissionById(input.id),
    ),

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
        status: z.enum(["submitted", "in_review", "approved", "in_progress", "delivered", "completed", "cancelled"]),
      }),
    )
    .mutation(({ input }) =>
      updateCommissionStatus(input.id, input.status),
    ),
});

export const draftRouter = createRouter({
  list: authedQuery.query(({ ctx }) =>
    findDraftsByUser(ctx.user.id),
  ),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) =>
      findDraftById(input.id),
    ),

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
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updateDraft(id, data);
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) =>
      deleteDraft(input.id),
    ),
});

export const messageRouter = createRouter({
  list: authedQuery.query(({ ctx }) =>
    findMessagesByUser(ctx.user.id),
  ),

  byCommission: authedQuery
    .input(z.object({ commissionId: z.number() }))
    .query(({ input }) =>
      findMessagesByCommission(input.commissionId),
    ),

  create: authedQuery
    .input(
      z.object({
        commissionId: z.number().optional(),
        content: z.string().min(1),
      }),
    )
    .mutation(({ ctx, input }) =>
      createMessage({
        ...input,
        userId: ctx.user.id,
        senderType: "client",
      }),
    ),

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
