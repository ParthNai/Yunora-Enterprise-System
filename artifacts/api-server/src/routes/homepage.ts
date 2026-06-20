import { Router, type IRouter } from "express";
import { db, homepageSectionsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

function fmt(row: any) {
  return {
    ...row,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  };
}

router.get("/homepage-sections", async (req, res): Promise<void> => {
  const rows = await db.select().from(homepageSectionsTable).orderBy(asc(homepageSectionsTable.sortOrder));
  res.json(rows.map(fmt));
});

router.post("/homepage-sections", async (req, res): Promise<void> => {
  const body = req.body;
  if (!body.sectionType) {
    res.status(400).json({ error: "sectionType is required" });
    return;
  }
  const [row] = await db.insert(homepageSectionsTable).values({
    sectionType: body.sectionType,
    title: body.title || null,
    subtitle: body.subtitle || null,
    content: body.content || null,
    imageUrl: body.imageUrl || null,
    linkUrl: body.linkUrl || null,
    buttonText: body.buttonText || null,
    isActive: body.isActive ?? true,
    sortOrder: body.sortOrder ?? 0,
  }).returning();
  res.status(201).json(fmt(row));
});

router.get("/homepage-sections/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.select().from(homepageSectionsTable).where(eq(homepageSectionsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.patch("/homepage-sections/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = req.body;
  const updates: Record<string, any> = {};
  if (body.sectionType !== undefined) updates.sectionType = body.sectionType;
  if (body.title !== undefined) updates.title = body.title || null;
  if (body.subtitle !== undefined) updates.subtitle = body.subtitle || null;
  if (body.content !== undefined) updates.content = body.content || null;
  if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl || null;
  if (body.linkUrl !== undefined) updates.linkUrl = body.linkUrl || null;
  if (body.buttonText !== undefined) updates.buttonText = body.buttonText || null;
  if (body.isActive !== undefined) updates.isActive = body.isActive;
  if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;
  const [row] = await db.update(homepageSectionsTable).set(updates).where(eq(homepageSectionsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.delete("/homepage-sections/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(homepageSectionsTable).where(eq(homepageSectionsTable.id, id));
  res.sendStatus(204);
});

export default router;
