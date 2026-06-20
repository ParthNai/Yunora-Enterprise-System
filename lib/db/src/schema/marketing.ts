import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// enum bannerTypeEnum was removed
// enum couponTypeEnum was removed

export const bannersTable = sqliteTable("banners", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url"),
  type: text("type", { enum: ["homepage", "mobile", "category", "festival", "collection"] }).notNull().default("homepage"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  priority: integer("priority").notNull().default(0),
  startsAt: integer("starts_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const offersTable = sqliteTable("offers", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  text: text("text").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  priority: integer("priority").notNull().default(0),
  startsAt: integer("starts_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const couponsTable = sqliteTable("coupons", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  type: text("type", { enum: ["percentage", "fixed"] }).notNull(),
  value: real("value").notNull(),
  minOrderAmount: real("min_order_amount"),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const campaignsTable = sqliteTable("campaigns", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
  startsAt: integer("starts_at", { mode: "timestamp" }),
  endsAt: integer("ends_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const insertBannerSchema = createInsertSchema(bannersTable).omit({ id: true, createdAt: true });
export type InsertBanner = z.infer<typeof insertBannerSchema>;
export type Banner = typeof bannersTable.$inferSelect;

export const insertOfferSchema = createInsertSchema(offersTable).omit({ id: true, createdAt: true });
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offersTable.$inferSelect;

export const insertCouponSchema = createInsertSchema(couponsTable).omit({ id: true, createdAt: true, usageCount: true });
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof couponsTable.$inferSelect;

export const insertCampaignSchema = createInsertSchema(campaignsTable).omit({ id: true, createdAt: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaignsTable.$inferSelect;
