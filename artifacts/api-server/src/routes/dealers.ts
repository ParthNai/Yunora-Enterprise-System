import { Router, type IRouter } from "express";
import { db, dealersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { CreateDealerBody, UpdateDealerBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatDealer(d: any) {
  return {
    ...d,
    discountPercent: parseFloat(d.discountPercent ?? "0"),
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : d.createdAt,
  };
}

router.get("/dealers", async (req, res): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const status = req.query.status as string | undefined;
  const limit = 20;
  const offset = (page - 1) * limit;

  const where = status ? eq(dealersTable.status, status as any) : undefined;
  const [items, totalRow] = await Promise.all([
    db.select().from(dealersTable).where(where).limit(limit).offset(offset).orderBy(sql`created_at desc`),
    db.select({ count: sql<number>`count(*)::int` }).from(dealersTable).where(where),
  ]);

  res.json({ items: items.map(formatDealer), total: totalRow[0]?.count ?? 0, page, limit });
});

router.post("/dealers", async (req, res): Promise<void> => {
  const parsed = CreateDealerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [dealer] = await db.insert(dealersTable).values({
    ...parsed.data,
    discountPercent: String(parsed.data.discountPercent ?? 0),
  } as any).returning();
  res.status(201).json(formatDealer(dealer));
});

router.get("/dealers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [d] = await db.select().from(dealersTable).where(eq(dealersTable.id, id));
  if (!d) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatDealer(d));
});

router.patch("/dealers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateDealerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updates: any = { ...parsed.data };
  if (updates.discountPercent != null) updates.discountPercent = String(updates.discountPercent);
  const [d] = await db.update(dealersTable).set(updates).where(eq(dealersTable.id, id)).returning();
  if (!d) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatDealer(d));
});

export default router;
