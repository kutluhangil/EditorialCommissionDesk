import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!instance) {
    instance = drizzle(env.databaseUrl, {
      mode: "planetscale",
      schema: fullSchema,
    });
  }
  return instance;
}

/**
 * Execute a Drizzle query when DATABASE_URL is configured; otherwise (or on DB
 * connection error) transparently use the in-memory store fallback.
 */
export async function withFallback<T>(
  dbFn: () => Promise<T>,
  memFn: () => T,
): Promise<T> {
  if (!env.hasDatabase) {
    return memFn();
  }
  try {
    return await dbFn();
  } catch (err) {
    console.warn("[db] Falling back to in-memory store:", err);
    return memFn();
  }
}
