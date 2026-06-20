import { Router, type IRouter } from "express";
import { db, warehousesTable, inventoryTable, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { CreateWarehouseBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/warehouses", async (req, res): Promise<void> => {
  const rows = await db.select().from(warehousesTable).orderBy(warehousesTable.name);
  res.json(rows.map(w => ({ ...w, totalItems: 0 })));
});

router.post("/warehouses", async (req, res): Promise<void> => {
  const parsed = CreateWarehouseBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [w] = await db.insert(warehousesTable).values(parsed.data as any).returning();
  res.status(201).json({ ...w, totalItems: 0 });
});

router.get("/inventory", async (req, res): Promise<void> => {
  const warehouseId = req.query.warehouseId ? parseInt(req.query.warehouseId as string) : undefined;
  const lowStock = req.query.lowStock === "true";

  const rows = await db.all(sql`
    SELECT i.id, i.product_id as "productId", p.name as "productName", p.sku,
           w.name as "warehouseName", i.stock, i.low_stock_threshold as "lowStockThreshold",
           i.stock <= i.low_stock_threshold as "isLowStock"
    FROM inventory i
    JOIN products p ON p.id = i.product_id
    JOIN warehouses w ON w.id = i.warehouse_id
    ${warehouseId ? sql`WHERE i.warehouse_id = ${warehouseId}` : sql``}
    ORDER BY i.stock ASC
  `);

  let data = (rows as any[]).map(r => ({
    ...r,
    isLowStock: r.isLowStock === true || r.isLowStock === "true",
  }));

  if (lowStock) data = data.filter(r => r.isLowStock);
  res.json(data);
});

export default router;
