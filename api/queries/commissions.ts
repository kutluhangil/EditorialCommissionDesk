import { getDb } from "./connection";
import { commissions, commissionDrafts, messages } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export async function findCommissionsByUser(userId: number) {
  return getDb().query.commissions.findMany({
    where: eq(commissions.userId, userId),
    orderBy: desc(commissions.createdAt),
  });
}

export async function findCommissionById(id: number) {
  return getDb().query.commissions.findFirst({
    where: eq(commissions.id, id),
  });
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
  const [{ id }] = await getDb()
    .insert(commissions)
    .values(data)
    .$returningId();
  return findCommissionById(id);
}

export async function updateCommissionStatus(
  id: number,
  status: (typeof commissions.$inferInsert)["status"]
) {
  await getDb()
    .update(commissions)
    .set({ status, updatedAt: new Date() })
    .where(eq(commissions.id, id));
  return findCommissionById(id);
}

export async function findDraftsByUser(userId: number) {
  return getDb().query.commissionDrafts.findMany({
    where: eq(commissionDrafts.userId, userId),
    orderBy: desc(commissionDrafts.updatedAt),
  });
}

export async function findDraftById(id: number) {
  return getDb().query.commissionDrafts.findFirst({
    where: eq(commissionDrafts.id, id),
  });
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
  const [{ id }] = await getDb()
    .insert(commissionDrafts)
    .values(data)
    .$returningId();
  return findDraftById(id);
}

export async function updateDraft(
  id: number,
  data: Partial<typeof commissionDrafts.$inferInsert>
) {
  await getDb()
    .update(commissionDrafts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(commissionDrafts.id, id));
  return findDraftById(id);
}

export async function deleteDraft(id: number) {
  await getDb().delete(commissionDrafts).where(eq(commissionDrafts.id, id));
}

export async function findMessagesByUser(userId: number) {
  return getDb().query.messages.findMany({
    where: eq(messages.userId, userId),
    orderBy: desc(messages.createdAt),
  });
}

export async function findMessagesByCommission(commissionId: number) {
  return getDb().query.messages.findMany({
    where: eq(messages.commissionId, commissionId),
    orderBy: desc(messages.createdAt),
  });
}

export async function createMessage(data: {
  userId: number;
  commissionId?: number;
  senderType: "client" | "studio";
  content: string;
}) {
  const [{ id }] = await getDb().insert(messages).values(data).$returningId();
  return getDb().query.messages.findFirst({
    where: eq(messages.id, id),
  });
}
