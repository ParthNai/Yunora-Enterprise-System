import {
  useGetDashboardStats,
  useGetRevenueChart,
  useGetTopProducts,
  useGetRecentOrders,
  useGetOrderStatusBreakdown,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  IndianRupee, ShoppingCart, Users, Building2, AlertTriangle, LifeBuoy,
  TrendingUp, TrendingDown, ArrowRight, Package
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b", confirmed: "#3b82f6", processing: "#8b5cf6",
  shipped: "#06b6d4", delivered: "#10b981", cancelled: "#ef4444",
};
const CHART_COLORS = ["#f59e0b","#3b82f6","#8b5cf6","#06b6d4","#10b981","#ef4444"];

const STATUS_BADGE: Record<string, string> = {
  pending:    "bg-amber-50 text-amber-700 border-amber-200",
  confirmed:  "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-purple-50 text-purple-700 border-purple-200",
  shipped:    "bg-cyan-50 text-cyan-700 border-cyan-200",
  delivered:  "bg-green-50 text-green-700 border-green-200",
  cancelled:  "bg-red-50 text-red-700 border-red-200",
};

export default function Dashboard() {
  const { data: stats, isLoading: sl } = useGetDashboardStats();
  const { data: revenueData, isLoading: rl } = useGetRevenueChart({ months: 6 });
  const { data: topProducts, isLoading: pl } = useGetTopProducts();
  const { data: recentOrders, isLoading: ol } = useGetRecentOrders();
  const { data: statusBreakdown, isLoading: stl } = useGetOrderStatusBreakdown();
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setLocation("/products")}>
          <Package className="h-3.5 w-3.5" /> Add Product
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Revenue" value={stats ? fmt(stats.totalRevenue) : null} sub={stats ? `Today ${fmt(stats.todayRevenue ?? 0)}` : null} icon={IndianRupee} loading={sl} accent="text-orange-500" trend="up" onClick={() => setLocation("/orders")} />
        <KpiCard label="Orders" value={stats?.totalOrders} sub={`${stats?.pendingOrders ?? 0} pending`} icon={ShoppingCart} loading={sl} accent="text-blue-500" onClick={() => setLocation("/orders")} />
        <KpiCard label="Customers" value={stats?.activeCustomers} sub="Active" icon={Users} loading={sl} accent="text-violet-500" onClick={() => setLocation("/customers")} />
        <KpiCard label="Dealers" value={stats?.totalDealers} sub="B2B partners" icon={Building2} loading={sl} accent="text-cyan-500" onClick={() => setLocation("/dealers")} />
        <KpiCard label="Low Stock" value={stats?.lowStockProducts} sub="Need restock" icon={AlertTriangle} loading={sl} accent={stats?.lowStockProducts ? "text-red-500" : "text-green-500"} trend={stats?.lowStockProducts ? "down" : null} onClick={() => setLocation("/inventory")} />
        <KpiCard label="Tickets" value={stats?.openTickets} sub="Open" icon={LifeBuoy} loading={sl} accent={stats?.openTickets ? "text-amber-500" : "text-green-500"} onClick={() => setLocation("/tickets")} />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Revenue chart */}
        <Card className="lg:col-span-3 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
            <div>
              <CardTitle className="text-sm font-semibold">Revenue — Last 6 Months</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setLocation("/orders")}>
              Orders <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            {rl ? <Skeleton className="h-52 w-full" /> : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData || []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F47B55" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#F47B55" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} dy={6} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} width={48} />
                    <Tooltip
                      contentStyle={{ borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                      formatter={(v: number) => [fmt(v), "Revenue"]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#F47B55" strokeWidth={2} fill="url(#rev)" dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: "#F47B55" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order status donut */}
        <Card className="lg:col-span-2 shadow-none">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm font-semibold">Order Status</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {stl ? <Skeleton className="h-52 w-full" /> : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusBreakdown || []} cx="50%" cy="42%" innerRadius={52} outerRadius={76} paddingAngle={2} dataKey="count" nameKey="status">
                      {(statusBreakdown || []).map((entry, i) => (
                        <Cell key={i} fill={STATUS_COLORS[entry.status] || CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend iconType="circle" iconSize={7} formatter={(v) => <span className="text-[11px] capitalize text-muted-foreground">{v}</span>} />
                    <Tooltip contentStyle={{ borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom tables */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Products */}
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
            <CardTitle className="text-sm font-semibold">Top Products</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setLocation("/products")}>
              All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {pl ? (
              <div className="p-4 space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-9 w-full" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 hover:bg-muted/20 border-b">
                    <TableHead className="text-[10px] uppercase tracking-wide py-2 font-semibold">#</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wide py-2 font-semibold">Product</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wide py-2 font-semibold text-right">Sales</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wide py-2 font-semibold text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(topProducts || []).map((p, i) => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/20 border-b last:border-0" onClick={() => setLocation(`/products/${p.id}`)}>
                      <TableCell className="py-2 text-xs text-muted-foreground font-bold w-8">{i + 1}</TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          {p.imageUrl
                            ? <img src={p.imageUrl} alt={p.name} className="h-7 w-7 rounded object-cover bg-muted shrink-0" />
                            : <div className="h-7 w-7 rounded bg-muted flex items-center justify-center shrink-0"><Package className="h-3 w-3 text-muted-foreground" /></div>
                          }
                          <span className="text-xs font-medium truncate max-w-[120px]">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-xs text-right">{p.sales}</TableCell>
                      <TableCell className="py-2 text-xs font-semibold text-right">{fmt(p.revenue)}</TableCell>
                    </TableRow>
                  ))}
                  {!topProducts?.length && (
                    <TableRow><TableCell colSpan={4} className="h-20 text-center text-xs text-muted-foreground">No sales data yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
            <CardTitle className="text-sm font-semibold">Recent Orders</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setLocation("/orders")}>
              All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {ol ? (
              <div className="p-4 space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-9 w-full" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 hover:bg-muted/20 border-b">
                    <TableHead className="text-[10px] uppercase tracking-wide py-2 font-semibold">Order</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wide py-2 font-semibold">Status</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wide py-2 font-semibold text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(recentOrders || []).map(order => (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-muted/20 border-b last:border-0" onClick={() => setLocation("/orders")}>
                      <TableCell className="py-2">
                        <code className="text-[11px] font-mono font-semibold text-primary">{order.orderNumber}</code>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[110px]">{order.customerName}</p>
                      </TableCell>
                      <TableCell className="py-2">
                        <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium capitalize ${STATUS_BADGE[order.status] || "bg-muted"}`}>
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 text-xs font-semibold text-right">{fmt(order.total)}</TableCell>
                    </TableRow>
                  ))}
                  {!recentOrders?.length && (
                    <TableRow><TableCell colSpan={3} className="h-20 text-center text-xs text-muted-foreground">No orders yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type KpiProps = {
  label: string;
  value: string | number | null | undefined;
  sub?: string | null;
  icon: React.ElementType;
  loading: boolean;
  accent?: string;
  trend?: "up" | "down" | null;
  onClick?: () => void;
};

function KpiCard({ label, value, sub, icon: Icon, loading, accent = "text-muted-foreground", trend, onClick }: KpiProps) {
  return (
    <Card
      className={`shadow-none border ${onClick ? "cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
              <Icon className={`h-3.5 w-3.5 ${accent}`} />
            </div>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold tracking-tight leading-none">
                {value !== undefined && value !== null ? value : "—"}
              </span>
              {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-green-500 mb-0.5" />}
              {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-red-500 mb-0.5" />}
            </div>
            {sub && <p className="text-[11px] text-muted-foreground mt-1 truncate">{sub}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
