import {
  mysqlTable,
  mysqlEnum,
  serial,
  bigint,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  commissions: many(commissions),
  drafts: many(commissionDrafts),
  messages: many(messages),
}));

export const commissions = mysqlTable("commissions", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  projectType: varchar("projectType", { length: 100 }).notNull(),
  deliverables: text("deliverables").notNull(),
  deadline: varchar("deadline", { length: 50 }).notNull(),
  budget: varchar("budget", { length: 50 }).notNull(),
  rightsUsage: varchar("rightsUsage", { length: 100 }).notNull(),
  visualReferences: text("visualReferences"),
  description: text("description"),
  status: mysqlEnum("status", ["submitted", "in_review", "approved", "in_progress", "delivered", "completed", "cancelled"]).default("submitted").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const commissionsRelations = relations(commissions, ({ one, many }) => ({
  user: one(users, { fields: [commissions.userId], references: [users.id] }),
  messages: many(messages),
}));

export const commissionDrafts = mysqlTable("commission_drafts", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  projectType: varchar("projectType", { length: 100 }),
  deliverables: text("deliverables"),
  deadline: varchar("deadline", { length: 50 }),
  budget: varchar("budget", { length: 50 }),
  rightsUsage: varchar("rightsUsage", { length: 100 }),
  visualReferences: text("visualReferences"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const commissionDraftsRelations = relations(commissionDrafts, ({ one }) => ({
  user: one(users, { fields: [commissionDrafts.userId], references: [users.id] }),
}));

export const messages = mysqlTable("messages", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  commissionId: bigint("commissionId", { mode: "number", unsigned: true }),
  senderType: mysqlEnum("senderType", ["client", "studio"]).default("client").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, { fields: [messages.userId], references: [users.id] }),
  commission: one(commissions, { fields: [messages.commissionId], references: [commissions.id] }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = typeof commissions.$inferInsert;
export type CommissionDraft = typeof commissionDrafts.$inferSelect;
export type InsertCommissionDraft = typeof commissionDrafts.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export type ProofStage = "wireframe" | "color_study" | "final_press";

export interface ProofDeliverable {
  id: number;
  commissionId: number;
  versionLabel: string;
  stage: ProofStage;
  imageUrl: string;
  fileFormat: string;
  notes: string;
  lockedUntilPaid: boolean;
  createdAt: Date;
}

export interface ProofPinAnnotation {
  id: number;
  commissionId: number;
  deliverableId: number;
  xPercent: number;
  yPercent: number;
  authorName: string;
  authorRole: "client" | "studio";
  comment: string;
  resolved: boolean;
  createdAt: Date;
}

export interface MilestoneInvoice {
  id: number;
  commissionId: number;
  title: string;
  percentage: number;
  amountUsd: number;
  status: "pending" | "paid";
  dueLabel: string;
  paidAt: Date | null;
}

export interface CommissionRevisionState {
  commissionId: number;
  includedRounds: number;
  usedRounds: number;
  extraRoundFeeUsd: number;
}

export interface CommissionAuditEntry {
  id: number;
  commissionId: number;
  actorName: string;
  actorRole: "client" | "studio" | "system";
  action: string;
  detail: string;
  createdAt: Date;
}

export interface CommissionWorkspaceData {
  commission: Commission;
  deliverables: ProofDeliverable[];
  pins: ProofPinAnnotation[];
  milestones: MilestoneInvoice[];
  revisionState: CommissionRevisionState;
  auditLogs: CommissionAuditEntry[];
  messages: Message[];
}

export interface CommissionWorkspaceSummary {
  commissionId: number;
  deliverablesCount: number;
  openPinsCount: number;
  resolvedPinsCount: number;
  paidAmountUsd: number;
  totalAmountUsd: number;
  usedRounds: number;
  includedRounds: number;
  extraRoundFeeUsd: number;
  milestones: MilestoneInvoice[];
  auditCount: number;
}
