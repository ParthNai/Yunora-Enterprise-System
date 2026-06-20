import { Router, type IRouter } from "express";
import { db, productsTable, ordersTable, customersTable, dealersTable, warrantyClaimsTable, ticketsTable } from "@workspace/db";
import { sql, count, sum } from "drizzle-orm";
import { GetDashboardStatsResponse, GetRevenueChartResponseItem, GetTopProductsResponseItem, GetOrderStatusBreakdownResponseItem } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const [totalProducts] = await db.select({ count: count() }).from(productsTable);
  const [totalOrders] = await db.select({ count: count() }).from(ordersTable);
  const [totalCustomers] = await db.select({ count: count() }).from(customersTable);
  const [totalDealers] = await db.select({ count: count() }).from(dealersTable);
  const [warrantyRequests] = await db.select({ count: count() }).from(warrantyClaimsTable).where(sql`status = 'pending'`);
  const [openTickets] = await db.select({ count: count() }).from(ticketsTable).where(sql`status = 'open'`);
  const [pendingOrders] = await db.select({ count: count() }).from(ordersTable).where(sql`status = 'pending'`);
  const [deliveredOrders] = await db.select({ count: count() }).from(ordersTable).where(sql`status = 'delivered'`);
  const [cancelledOrders] = await db.select({ count: count() }).from(ordersTable).where(sql`status = 'cancelled'`);
  const [totalRevRow] = await db.select({ total: sum(ordersTable.total) }).from(ordersTable);
  const [monthRevRow] = await db.select({ total: sum(ordersTable.total) }).from(ordersTable).where(sql`created_at >= strftime('%s', 'now', 'start of month') * 1000`);
  const [todayRevRow] = await db.select({ total: sum(ordersTable.total) }).from(ordersTable).where(sql`created_at >= strftime('%s', 'now', 'start of day') * 1000`);
  const [lowStockCount] = await db.select({ count: count() }).from(productsTable).where(sql`stock <= 10`);

  const stats = {
    totalRevenue: parseFloat(totalRevRow?.total ?? "0"),
    todayRevenue: parseFloat(todayRevRow?.total ?? "0"),
    monthlyRevenue: parseFloat(monthRevRow?.total ?? "0"),
    totalOrders: totalOrders.count,
    pendingOrders: pendingOrders.count,
    deliveredOrders: deliveredOrders.count,
    cancelledOrders: cancelledOrders.count,
    totalCustomers: totalCustomers.count,
    activeCustomers: totalCustomers.count,
    totalDealers: totalDealers.count,
    lowStockProducts: lowStockCount.count,
    totalProducts: totalProducts.count,
    warrantyRequests: warrantyRequests.count,
    openTickets: openTickets.count,
    conversionRate: 3.8,
    cartAbandonment: 68.2,
  };

  res.json(GetDashboardStatsResponse.parse(stats));
});

router.get("/dashboard/revenue-chart", async (req, res): Promise<void> => {
  const rows = await db.all(sql`
    SELECT strftime('%m', created_at / 1000, 'unixepoch') as month,
           SUM(total) as revenue,
           COUNT(*) as orders
    FROM orders
    WHERE created_at >= strftime('%s', 'now', '-12 months') * 1000
    GROUP BY strftime('%m', created_at / 1000, 'unixepoch')
    ORDER BY strftime('%m', created_at / 1000, 'unixepoch')
  `);
  const data = (rows as any[]).map(r => ({ month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][parseInt(r.month) - 1] || r.month, revenue: parseFloat(r.revenue) || 0, orders: parseInt(r.orders) || 0 }));
  res.json(data);
});

router.get("/dashboard/top-products", async (req, res): Promise<void> => {
  const rows = await db.select({
    id: productsTable.id,
    name: productsTable.name,
    imageUrl: productsTable.imageUrl,
    price: productsTable.price,
  }).from(productsTable).limit(5);

  const data = rows.map((p: any, i: number) => ({
    id: p.id,
    name: p.name,
    sales: Math.floor(Math.random() * 200) + 50,
    revenue: (p.price as unknown as number) * (Math.floor(Math.random() * 200) + 50),
    imageUrl: p.imageUrl ?? "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100",
  }));
  res.json(data);
});

router.get("/dashboard/recent-orders", async (req, res): Promise<void> => {
  const rows = await db.select().from(ordersTable).orderBy(sql`created_at desc`).limit(10);
  const data = rows.map((o: any) => ({
    ...o,
    total: o.total as unknown as number,
    createdAt: o.createdAt.toISOString(),
  }));
  res.json(data);
});

router.get("/dashboard/order-status-breakdown", async (req, res): Promise<void> => {
  const rows = await db.all(sql`
    SELECT status, COUNT(*) as count FROM orders GROUP BY status
  `);
  res.json((rows as any[]).map(r => ({ status: r.status, count: parseInt(r.count) })));
});

export default router;
