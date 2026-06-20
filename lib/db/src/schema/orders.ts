import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// enum orderStatusEnum was removed

export const customersTable = sqliteTable("customers", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  city: text("city"),
  totalOrders: integer("total_orders").notNull().default(0),
  totalSpent: real("total_spent").notNull().default(0),
  lastOrderAt: integer("last_order_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const ordersTable = sqliteTable("orders", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  orderNumber: text("order_number").notNull().unique(),
  customerId: integer("customer_id"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  total: real("total").notNull(),
  status: text("status", { enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"] }).notNull().default("pending"),
  paymentStatus: text("payment_status").default("pending"),
  items: integer("items").notNull().default(1),
  city: text("city"),
  trackingNumber: text("tracking_number"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;

export const insertCustomerSchema = createInsertSchema(customersTable).omit({ id: true, createdAt: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customersTable.$inferSelect;
