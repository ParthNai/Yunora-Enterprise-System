import { Router, type IRouter } from "express";
import { db, bannersTable, offersTable, couponsTable, campaignsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { CreateBannerBody, UpdateBannerBody, CreateOfferBody, UpdateOfferBody, CreateCouponBody, UpdateCouponBody, CreateCampaignBody, UpdateCampaignBody } from "@workspace/api-zod";

const router: IRouter = Router();

function fmt(row: any) {
  const r = { ...row };
  if (r.createdAt instanceof Date) r.createdAt = r.createdAt.toISOString();
  if (r.startsAt instanceof Date) r.startsAt = r.startsAt.toISOString();
  if (r.expiresAt instanceof Date) r.expiresAt = r.expiresAt.toISOString();
  if (r.endsAt instanceof Date) r.endsAt = r.endsAt.toISOString();
  if (r.value != null) r.value = parseFloat(r.value);
  if (r.minOrderAmount != null) r.minOrderAmount = parseFloat(r.minOrderAmount);
  return r;
}

// Banners
router.get("/banners", async (req, res): Promise<void> => {
  const rows = await db.select().from(bannersTable).orderBy(bannersTable.priority);
  res.json(rows.map(fmt));
});

router.post("/banners", async (req, res): Promise<void> => {
  const parsed = CreateBannerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [b] = await db.insert(bannersTable).values(parsed.data as any).returning();
  res.status(201).json(fmt(b));
});

router.patch("/banners/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateBannerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [b] = await db.update(bannersTable).set(parsed.data as any).where(eq(bannersTable.id, id)).returning();
  if (!b) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(b));
});

router.delete("/banners/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(bannersTable).where(eq(bannersTable.id, id));
  res.sendStatus(204);
});

// Offers
router.get("/offers", async (req, res): Promise<void> => {
  const rows = await db.select().from(offersTable).orderBy(offersTable.priority);
  res.json(rows.map(fmt));
});

router.post("/offers", async (req, res): Promise<void> => {
  const parsed = CreateOfferBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [o] = await db.insert(offersTable).values(parsed.data as any).returning();
  res.status(201).json(fmt(o));
});

router.patch("/offers/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateOfferBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [o] = await db.update(offersTable).set(parsed.data as any).where(eq(offersTable.id, id)).returning();
  if (!o) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(o));
});

router.delete("/offers/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(offersTable).where(eq(offersTable.id, id));
  res.sendStatus(204);
});

// Coupons
router.get("/coupons", async (req, res): Promise<void> => {
  const rows = await db.select().from(couponsTable).orderBy(sql`created_at desc`);
  res.json(rows.map(fmt));
});

router.post("/coupons", async (req, res): Promise<void> => {
  const parsed = CreateCouponBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const d = parsed.data as any;
  const [c] = await db.insert(couponsTable).values({ ...d, value: String(d.value), minOrderAmount: d.minOrderAmount != null ? String(d.minOrderAmount) : null }).returning();
  res.status(201).json(fmt(c));
});

router.patch("/coupons/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateCouponBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const d = parsed.data as any;
  const updates: any = { ...d };
  if (updates.value != null) updates.value = String(updates.value);
  if (updates.minOrderAmount != null) updates.minOrderAmount = String(updates.minOrderAmount);
  const [c] = await db.update(couponsTable).set(updates).where(eq(couponsTable.id, id)).returning();
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(c));
});

router.delete("/coupons/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(couponsTable).where(eq(couponsTable.id, id));
  res.sendStatus(204);
});

// Campaigns
router.get("/campaigns", async (req, res): Promise<void> => {
  const rows = await db.select().from(campaignsTable).orderBy(sql`created_at desc`);
  res.json(rows.map(fmt));
});

router.post("/campaigns", async (req, res): Promise<void> => {
  const parsed = CreateCampaignBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [c] = await db.insert(campaignsTable).values(parsed.data as any).returning();
  res.status(201).json(fmt(c));
});

router.patch("/campaigns/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateCampaignBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [c] = await db.update(campaignsTable).set(parsed.data as any).where(eq(campaignsTable.id, id)).returning();
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(c));
});

export default router;
