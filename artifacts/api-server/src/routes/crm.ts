import { Router, type IRouter } from "express";
import { db, leadsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { CreateLeadBody, UpdateLeadBody } from "@workspace/api-zod";

const router: IRouter = Router();

function fmt(l: any) {
  return {
    ...l,
    createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt,
  };
}

router.get("/leads", async (req, res): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const status = req.query.status as string | undefined;
  const limit = 20;
  const offset = (page - 1) * limit;

  const where = status ? eq(leadsTable.status, status as any) : undefined;
  const [items, totalRow] = await Promise.all([
    db.select().from(leadsTable).where(where).limit(limit).offset(offset).orderBy(sql`created_at desc`),
    db.select({ count: sql<number>`count(*)::int` }).from(leadsTable).where(where),
  ]);
  res.json({ items: items.map(fmt), total: totalRow[0]?.count ?? 0, page, limit });
});

router.post("/leads", async (req, res): Promise<void> => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [l] = await db.insert(leadsTable).values(parsed.data as any).returning();
  res.status(201).json(fmt(l));
});

router.patch("/leads/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateLeadBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [l] = await db.update(leadsTable).set(parsed.data as any).where(eq(leadsTable.id, id)).returning();
  if (!l) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(l));
});

export default router;
