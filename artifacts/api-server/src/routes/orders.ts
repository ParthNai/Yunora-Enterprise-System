import { Router, type IRouter } from "express";
import { db, ordersTable, customersTable } from "@workspace/db";
import { eq, sql, ilike, and } from "drizzle-orm";
import { ListOrdersQueryParams, UpdateOrderBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatOrder(o: any) {
  return {
    ...o,
    total: parseFloat(o.total),
    createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
  };
}

router.get("/orders", async (req, res): Promise<void> => {
  const parsed = ListOrdersQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const status = parsed.success ? parsed.data.status : undefined;
  const search = parsed.success ? parsed.data.search : undefined;
  const offset = (page - 1) * limit;

  let conditions: any[] = [];
  if (status) conditions.push(eq(ordersTable.status, status as any));
  if (search) conditions.push(ilike(ordersTable.customerName, `%${search}%`));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, totalRow] = await Promise.all([
    db.select().from(ordersTable).where(where).limit(limit).offset(offset).orderBy(sql`created_at desc`),
    db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(where),
  ]);

  res.json({ items: items.map(formatOrder), total: totalRow[0]?.count ?? 0, page, limit });
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatOrder(order));
});

router.patch("/orders/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [order] = await db.update(ordersTable).set(parsed.data as any).where(eq(ordersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatOrder(order));
});

// Customers
router.get("/customers", async (req, res): Promise<void> => {
  const page = parseInt(req.query.page as unknown as string) || 1;
  const search = req.query.search as unknown as string | undefined;
  const limit = 20;
  const offset = (page - 1) * limit;

  const where = search ? ilike(customersTable.name, `%${search}%`) : undefined;
  const [items, totalRow] = await Promise.all([
    db.select().from(customersTable).where(where).limit(limit).offset(offset).orderBy(sql`created_at desc`),
    db.select({ count: sql<number>`count(*)::int` }).from(customersTable).where(where),
  ]);

  res.json({
    items: items.map((c: any) => ({
      ...c,
      totalSpent: parseFloat(c.totalSpent as unknown as string),
      lastOrderAt: c.lastOrderAt ? c.lastOrderAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
    })),
    total: totalRow[0]?.count ?? 0,
    page,
  limit,
});
});

router.get("/customers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [c] = await db.select().from(customersTable).where(eq(customersTable.id, id));
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  res.json({
    ...c,
    totalSpent: parseFloat(c.totalSpent as unknown as string),
    lastOrderAt: c.lastOrderAt ? c.lastOrderAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  });
});

export default router;
