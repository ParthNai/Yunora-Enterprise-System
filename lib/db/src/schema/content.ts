import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// enum blogStatusEnum was removed

export const blogsTable = sqliteTable("blogs", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content"),
  imageUrl: text("image_url"),
  category: text("category"),
  tags: text("tags"),
  status: text("status", { enum: ["draft", "published", "archived"] }).notNull().default("draft"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

export const activityLogsTable = sqliteTable("activity_logs", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id"),
  user: text("user").notNull().default("Super Admin"),
  details: text("details"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const siteSettingsTable = sqliteTable("site_settings", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  siteName: text("site_name").notNull().default("Yunora Furnishings"),
  email: text("email").notNull().default("hello@yunora.in"),
  phone: text("phone").notNull().default("+91 98765 43210"),
  whatsapp: text("whatsapp"),
  address: text("address"),
  facebook: text("facebook"),
  instagram: text("instagram"),
  youtube: text("youtube"),
  linkedin: text("linkedin"),
  twitter: text("twitter"),
  pinterest: text("pinterest"),
  googleMapsEmbed: text("google_maps_embed"),
  razorpayKeyId: text("razorpay_key_id"),
  razorpayKeySecret: text("razorpay_key_secret"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

// enum homepageSectionTypeEnum was removed

export const homepageSectionsTable = sqliteTable("homepage_sections", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  sectionType: text("section_type", { enum: [
  "hero",
  "featured_products",
  "testimonials",
  "about",
  "usp",
  "newsletter",
  "custom",
] }).notNull(),
  title: text("title"),
  subtitle: text("subtitle"),
  content: text("content"),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  buttonText: text("button_text"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

export const insertBlogSchema = createInsertSchema(blogsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBlog = z.infer<typeof insertBlogSchema>;
export type Blog = typeof blogsTable.$inferSelect;

export const insertActivityLogSchema = createInsertSchema(activityLogsTable).omit({ id: true, createdAt: true });
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogsTable.$inferSelect;

export const insertSiteSettingsSchema = createInsertSchema(siteSettingsTable).omit({ id: true, updatedAt: true });
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type SiteSettings = typeof siteSettingsTable.$inferSelect;

export const insertHomepageSectionSchema = createInsertSchema(homepageSectionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHomepageSection = z.infer<typeof insertHomepageSectionSchema>;
export type HomepageSection = typeof homepageSectionsTable.$inferSelect;

// enum adminRoleEnum was removed

export const adminUsersTable = sqliteTable("admin_users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["super_admin", "admin", "editor"] }).notNull().default("admin"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});
