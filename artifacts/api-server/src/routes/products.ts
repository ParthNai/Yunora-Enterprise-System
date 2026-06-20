import { Router, type IRouter } from "express";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq, sql, ilike, and } from "drizzle-orm";
import {
  ListProductsQueryParams,
  CreateProductBody,
  GetProductParams,
  GetProductResponse,
  UpdateProductParams,
  UpdateProductBody,
  DeleteProductParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const search = parsed.success ? parsed.data.search : undefined;
  const status = parsed.success ? parsed.data.status : undefined;
  const offset = (page - 1) * limit;

  let conditions: any[] = [];
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
  if (status) conditions.push(eq(productsTable.status, status as any));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, totalRow] = await Promise.all([
    db.select({
      id: productsTable.id,
      name: productsTable.name,
      sku: productsTable.sku,
      categoryId: productsTable.categoryId,
      brand: productsTable.brand,
      price: productsTable.price,
      salePrice: productsTable.salePrice,
      stock: productsTable.stock,
      color: productsTable.color,
      material: productsTable.material,
      description: productsTable.description,
      imageUrl: productsTable.imageUrl,
      status: productsTable.status,
      createdAt: productsTable.createdAt,
    }).from(productsTable).where(whereClause).limit(limit).offset(offset).orderBy(sql`created_at desc`),
    db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(whereClause),
  ]);

  res.json({
    items: items.map((p: any) => ({
      ...p,
      price: parseFloat(p.price as unknown as string),
      salePrice: p.salePrice ? parseFloat(p.salePrice as unknown as string) : null,
      categoryName: null,
      createdAt: (p.createdAt as Date).toISOString(),
  })),
  total: totalRow[0]?.count ?? 0,
  page,
  limit,
});
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [product] = await db.insert(productsTable).values({
    ...parsed.data,
    price: String(parsed.data.price),
    salePrice: parsed.data.salePrice != null ? String(parsed.data.salePrice) : null,
  } as any).returning();
  res.status(201).json({
    ...product,
    price: parseFloat(product.price as unknown as string),
    salePrice: product.salePrice ? parseFloat(product.salePrice as unknown as string) : null,
    categoryName: null,
    createdAt: (product.createdAt as Date).toISOString(),
  });
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!product) { res.status(404).json({ error: "Not found" }); return; }

  res.json({
    ...product,
    price: parseFloat(product.price as unknown as string),
    salePrice: product.salePrice ? parseFloat(product.salePrice as unknown as string) : null,
    categoryName: null,
    createdAt: (product.createdAt as Date).toISOString(),
  });
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updates: any = { ...parsed.data };
  if (updates.price != null) updates.price = String(updates.price);
  if (updates.salePrice != null) updates.salePrice = String(updates.salePrice);

  const [product] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
  if (!product) { res.status(404).json({ error: "Not found" }); return; }

  res.json({
    ...product,
    price: parseFloat(product.price as unknown as string),
    salePrice: product.salePrice ? parseFloat(product.salePrice as unknown as string) : null,
    categoryName: null,
    createdAt: (product.createdAt as Date).toISOString(),
  });
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.sendStatus(204);
});

// Categories
router.get("/categories", async (req, res): Promise<void> => {
  const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
  res.json(cats.map((c: any) => ({ ...c, productCount: 0 })));
});

router.post("/categories", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.omit({ name: true, sku: true, price: true, stock: true } as any).safeParse(req.body);
  const body = req.body;
  if (!body.name || !body.slug) { res.status(400).json({ error: "name and slug required" }); return; }
  const [cat] = await db.insert(categoriesTable).values({ name: body.name, slug: body.slug, parentId: body.parentId ?? null, imageUrl: body.imageUrl ?? null }).returning();
  res.status(201).json({ ...cat, productCount: 0 });
});

router.patch("/categories/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = req.body;
  const [cat] = await db.update(categoriesTable).set({ name: body.name, slug: body.slug, parentId: body.parentId ?? null, imageUrl: body.imageUrl ?? null }).where(eq(categoriesTable.id, id)).returning();
  if (!cat) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...cat, productCount: 0 });
});

router.delete("/categories/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  res.sendStatus(204);
});

export default router;
