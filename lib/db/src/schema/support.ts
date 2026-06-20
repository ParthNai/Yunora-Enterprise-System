import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// enum warrantyStatusEnum was removed
// enum reviewStatusEnum was removed
// enum ticketTypeEnum was removed
// enum ticketStatusEnum was removed
// enum ticketPriorityEnum was removed

export const warrantyClaimsTable = sqliteTable("warranty_claims", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  customerName: text("customer_name").notNull(),
  productName: text("product_name").notNull(),
  orderId: integer("order_id"),
  issue: text("issue").notNull(),
  status: text("status", { enum: ["pending", "under_review", "approved", "rejected", "resolved"] }).notNull().default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

export const reviewsTable = sqliteTable("reviews", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  customerName: text("customer_name").notNull(),
  productName: text("product_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  status: text("status", { enum: ["pending", "approved", "rejected", "featured", "hidden"] }).notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const ticketsTable = sqliteTable("tickets", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  subject: text("subject").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  type: text("type", { enum: ["product_support", "warranty", "delivery", "general"] }).notNull().default("general"),
  status: text("status", { enum: ["open", "in_progress", "resolved", "closed"] }).notNull().default("open"),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).notNull().default("medium"),
  assignedTo: text("assigned_to"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

export const insertWarrantyClaimSchema = createInsertSchema(warrantyClaimsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWarrantyClaim = z.infer<typeof insertWarrantyClaimSchema>;
export type WarrantyClaim = typeof warrantyClaimsTable.$inferSelect;

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;

export const insertTicketSchema = createInsertSchema(ticketsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof ticketsTable.$inferSelect;
