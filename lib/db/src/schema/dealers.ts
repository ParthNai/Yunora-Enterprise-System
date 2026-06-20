import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// enum dealerStatusEnum was removed

export const dealersTable = sqliteTable("dealers", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  city: text("city"),
  discountPercent: real("discount_percent").notNull().default(0),
  totalOrders: integer("total_orders").notNull().default(0),
  status: text("status", { enum: ["pending", "approved", "rejected", "suspended"] }).notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

export const insertDealerSchema = createInsertSchema(dealersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDealer = z.infer<typeof insertDealerSchema>;
export type Dealer = typeof dealersTable.$inferSelect;
