import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { InsertUser, User } from "@db/schema";
import { getDb, withFallback } from "./connection";
import { env } from "../lib/env";
import { memFindUserByUnionId, memUpsertUser } from "./memory-store";

export async function findUserByUnionId(
  unionId: string,
): Promise<User | undefined> {
  return withFallback(
    async () => {
      const rows = await getDb()
        .select()
        .from(schema.users)
        .where(eq(schema.users.unionId, unionId))
        .limit(1);
      return rows.at(0);
    },
    () => memFindUserByUnionId(unionId),
  );
}

export async function upsertUser(data: InsertUser): Promise<User | undefined> {
  const values: InsertUser = { ...data };
  const updateSet: Partial<InsertUser> = {
    lastSignInAt: new Date(),
    ...data,
  };

  if (
    values.role === undefined &&
    values.unionId &&
    values.unionId === env.ownerUnionId
  ) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  return withFallback(
    async () => {
      await getDb()
        .insert(schema.users)
        .values(values)
        .onDuplicateKeyUpdate({ set: updateSet });
      const rows = await getDb()
        .select()
        .from(schema.users)
        .where(eq(schema.users.unionId, values.unionId))
        .limit(1);
      return rows.at(0);
    },
    () => memUpsertUser(values),
  );
}
