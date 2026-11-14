import { getDb, withFallback } from "./connection";
import { commissions, commissionDrafts, messages } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import {
  memAddDeliverable,
  memAddProofPin,
  memCreateCommission,
  memCreateDraft,
  memCreateMessage,
  memDeleteDraft,
  memFindAllCommissions,
  memFindAllMessages,
  memFindCommissionById,
  memFindCommissionsByUser,
  memFindDraftById,
  memFindDraftsByUser,
  memFindMessagesByCommission,
  memFindMessagesByUser,
  memFindPinById,
  memGetAllWorkspacesSummary,
  memGetCommissionWorkspace,
  memPayMilestone,
  memRecordAuditEvent,
  memRequestRevision,
  memToggleProofPinResolved,
  memUpdateCommissionStatus,
  memUpdateDraft,
} from "./memory-store";
import type { ProofStage } from "@db/schema";

export async function findCommissionsByUser(userId: number) {
  return withFallback(
    () =>
      getDb().query.commissions.findMany({
        where: eq(commissions.userId, userId),
        orderBy: desc(commissions.createdAt),
      }),
    () => memFindCommissionsByUser(userId),
  );
}

export async function findAllCommissions() {
  return withFallback(
    () =>
      getDb().query.commissions.findMany({
        orderBy: desc(commissions.createdAt),
      }),
    () => memFindAllCommissions(),
  );
}

export async function findCommissionById(id: number) {
  return withFallback(
    () =>
      getDb().query.commissions.findFirst({
        where: eq(commissions.id, id),
      }),
    () => memFindCommissionById(id),
  );
}

export async function createCommission(data: {
  userId: number;
  projectType: string;
  deliverables: string;
  deadline: string;
  budget: string;
  rightsUsage: string;
  visualReferences?: string;
  description?: string;
}) {
  return withFallback(
    async () => {
      const [{ id }] = await getDb()
        .insert(commissions)
        .values(data)
        .$returningId();
      return getDb().query.commissions.findFirst({
        where: eq(commissions.id, id),
      });
    },
    () => memCreateCommission(data),
  );
}

export async function updateCommissionStatus(
  id: number,
  status: (typeof commissions.$inferInsert)["status"],
) {
  return withFallback(
    async () => {
      await getDb()
        .update(commissions)
        .set({ status, updatedAt: new Date() })
        .where(eq(commissions.id, id));
      return getDb().query.commissions.findFirst({
        where: eq(commissions.id, id),
      });
    },
    () => memUpdateCommissionStatus(id, status ?? "submitted"),
  );
}

export async function findDraftsByUser(userId: number) {
  return withFallback(
    () =>
      getDb().query.commissionDrafts.findMany({
        where: eq(commissionDrafts.userId, userId),
        orderBy: desc(commissionDrafts.updatedAt),
      }),
    () => memFindDraftsByUser(userId),
  );
}

export async function findDraftById(id: number) {
  return withFallback(
    () =>
      getDb().query.commissionDrafts.findFirst({
        where: eq(commissionDrafts.id, id),
      }),
    () => memFindDraftById(id),
  );
}

export async function createDraft(data: {
  userId: number;
  projectType?: string;
  deliverables?: string;
  deadline?: string;
  budget?: string;
  rightsUsage?: string;
  visualReferences?: string;
  description?: string;
}) {
  return withFallback(
    async () => {
      const [{ id }] = await getDb()
        .insert(commissionDrafts)
        .values(data)
        .$returningId();
      return getDb().query.commissionDrafts.findFirst({
        where: eq(commissionDrafts.id, id),
      });
    },
    () => memCreateDraft(data),
  );
}

export async function updateDraft(
  id: number,
  data: Partial<typeof commissionDrafts.$inferInsert>,
) {
  return withFallback(
    async () => {
      await getDb()
        .update(commissionDrafts)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(commissionDrafts.id, id));
      return getDb().query.commissionDrafts.findFirst({
        where: eq(commissionDrafts.id, id),
      });
    },
    () => memUpdateDraft(id, data),
  );
}

export async function deleteDraft(id: number) {
  return withFallback(
    async () => {
      await getDb().delete(commissionDrafts).where(eq(commissionDrafts.id, id));
    },
    () => memDeleteDraft(id),
  );
}

export async function findMessagesByUser(userId: number) {
  return withFallback(
    () =>
      getDb().query.messages.findMany({
        where: eq(messages.userId, userId),
        orderBy: desc(messages.createdAt),
      }),
    () => memFindMessagesByUser(userId),
  );
}

export async function findMessagesByCommission(commissionId: number) {
  return withFallback(
    () =>
      getDb().query.messages.findMany({
        where: eq(messages.commissionId, commissionId),
        orderBy: desc(messages.createdAt),
      }),
    () => memFindMessagesByCommission(commissionId),
  );
}

export async function findAllMessages() {
  return withFallback(
    () =>
      getDb().query.messages.findMany({
        orderBy: desc(messages.createdAt),
      }),
    () => memFindAllMessages(),
  );
}

export async function createMessage(data: {
  userId: number;
  commissionId?: number;
  senderType: "client" | "studio";
  content: string;
}) {
  return withFallback(
    async () => {
      const [{ id }] = await getDb().insert(messages).values(data).$returningId();
      return getDb().query.messages.findFirst({
        where: eq(messages.id, id),
      });
    },
    () => memCreateMessage(data),
  );
}

export async function getCommissionWorkspace(id: number) {
  const commission = await findCommissionById(id);
  if (!commission) return undefined;
  return memGetCommissionWorkspace(id, commission);
}

export async function getAllWorkspacesSummary(commissionIds?: number[]) {
  return memGetAllWorkspacesSummary(commissionIds);
}

export async function addProofPin(input: {
  commissionId: number;
  deliverableId: number;
  xPercent: number;
  yPercent: number;
  authorName: string;
  authorRole: "client" | "studio";
  comment: string;
}) {
  return memAddProofPin(input);
}

export async function findPinById(pinId: number) {
  return memFindPinById(pinId);
}

export async function toggleProofPinResolved(
  pinId: number,
  actorName: string,
  actorRole: "client" | "studio",
) {
  return memToggleProofPinResolved(pinId, actorName, actorRole);
}

export async function addDeliverable(
  input: {
    commissionId: number;
    versionLabel: string;
    stage: ProofStage;
    imageUrl: string;
    fileFormat: string;
    notes: string;
    lockedUntilPaid?: boolean;
  },
  actorName: string,
) {
  return memAddDeliverable(input, actorName);
}

export async function requestCommissionRevision(input: {
  commissionId: number;
  notes: string;
  actorName: string;
  actorRole: "client" | "studio";
  userId: number;
}) {
  return memRequestRevision(input);
}

export async function payCommissionMilestone(
  milestoneId: number,
  actorName: string,
) {
  return memPayMilestone(milestoneId, actorName);
}

export function recordCommissionAudit(
  entry: Parameters<typeof memRecordAuditEvent>[0],
) {
  return memRecordAuditEvent(entry);
}
