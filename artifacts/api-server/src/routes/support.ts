import { Router, type IRouter } from "express";
import { db, warrantyClaimsTable, reviewsTable, ticketsTable, activityLogsTable, siteSettingsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { UpdateWarrantyClaimBody, UpdateReviewBody, CreateTicketBody, UpdateTicketBody, SiteSettingsInput } from "@workspace/api-zod";

const router: IRouter = Router();

function fmt(r: any) {
  const out = { ...r };
  if (out.createdAt instanceof Date) out.createdAt = out.createdAt.toISOString();
  if (out.updatedAt instanceof Date) out.updatedAt = out.updatedAt.toISOString();
  return out;
}

// Warranty
router.get("/warranty", async (req, res): Promise<void> => {
  const status = req.query.status as string | undefined;
  const where = status ? eq(warrantyClaimsTable.status, status as any) : undefined;
  const rows = await db.select().from(warrantyClaimsTable).where(where).orderBy(sql`created_at desc`);
  res.json(rows.map(fmt));
});

router.patch("/warranty/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateWarrantyClaimBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [w] = await db.update(warrantyClaimsTable).set(parsed.data as any).where(eq(warrantyClaimsTable.id, id)).returning();
  if (!w) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(w));
});

// Reviews
router.get("/reviews", async (req, res): Promise<void> => {
  const status = req.query.status as string | undefined;
  const where = status ? eq(reviewsTable.status, status as any) : undefined;
  const rows = await db.select().from(reviewsTable).where(where).orderBy(sql`created_at desc`);
  res.json(rows.map(fmt));
});

router.patch("/reviews/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [r] = await db.update(reviewsTable).set(parsed.data as any).where(eq(reviewsTable.id, id)).returning();
  if (!r) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(r));
});

// Tickets
router.get("/tickets", async (req, res): Promise<void> => {
  const status = req.query.status as string | undefined;
  const where = status ? eq(ticketsTable.status, status as any) : undefined;
  const rows = await db.select().from(ticketsTable).where(where).orderBy(sql`created_at desc`);
  res.json(rows.map(fmt));
});

router.post("/tickets", async (req, res): Promise<void> => {
  const parsed = CreateTicketBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [t] = await db.insert(ticketsTable).values(parsed.data as any).returning();
  res.status(201).json(fmt(t));
});

router.patch("/tickets/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateTicketBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [t] = await db.update(ticketsTable).set(parsed.data as any).where(eq(ticketsTable.id, id)).returning();
  if (!t) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(t));
});

// Activity log
router.get("/activity", async (req, res): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = (page - 1) * limit;
  const rows = await db.select().from(activityLogsTable).limit(limit).offset(offset).orderBy(sql`created_at desc`);
  res.json(rows.map(fmt));
});

// Settings
router.get("/settings", async (req, res): Promise<void> => {
  let [settings] = await db.select().from(siteSettingsTable).limit(1);
  if (!settings) {
    const [s] = await db.insert(siteSettingsTable).values({}).returning();
    settings = s;
  }
  res.json(fmt(settings));
});

router.patch("/settings", async (req, res): Promise<void> => {
  const body = req.body;
  let [settings] = await db.select().from(siteSettingsTable).limit(1);
  if (!settings) {
    const [s] = await db.insert(siteSettingsTable).values({}).returning();
    settings = s;
  }
  const [updated] = await db.update(siteSettingsTable).set(body).where(eq(siteSettingsTable.id, settings.id)).returning();
  res.json(fmt(updated));
});

export default router;
