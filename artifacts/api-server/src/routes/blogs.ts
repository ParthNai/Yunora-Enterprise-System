import { Router, type IRouter } from "express";
import { db, blogsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { CreateBlogBody, UpdateBlogBody } from "@workspace/api-zod";

const router: IRouter = Router();

function fmt(b: any) {
  return {
    ...b,
    createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
  };
}

router.get("/blogs", async (req, res): Promise<void> => {
  const rows = await db.select().from(blogsTable).orderBy(sql`created_at desc`);
  res.json(rows.map(fmt));
});

router.post("/blogs", async (req, res): Promise<void> => {
  const parsed = CreateBlogBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [b] = await db.insert(blogsTable).values(parsed.data as any).returning();
  res.status(201).json(fmt(b));
});

router.get("/blogs/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [b] = await db.select().from(blogsTable).where(eq(blogsTable.id, id));
  if (!b) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(b));
});

router.patch("/blogs/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateBlogBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [b] = await db.update(blogsTable).set(parsed.data as any).where(eq(blogsTable.id, id)).returning();
  if (!b) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(b));
});

router.delete("/blogs/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(blogsTable).where(eq(blogsTable.id, id));
  res.sendStatus(204);
});

export default router;
