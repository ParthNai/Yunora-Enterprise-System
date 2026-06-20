import { useState } from "react";
import { useListOrders, useUpdateOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;

const STATUS_STYLE: Record<string, string> = {
  pending:    "bg-amber-50 text-amber-700 border-amber-200",
  confirmed:  "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-purple-50 text-purple-700 border-purple-200",
  shipped:    "bg-cyan-50 text-cyan-700 border-cyan-200",
  delivered:  "bg-green-50 text-green-700 border-green-200",
  cancelled:  "bg-red-50 text-red-700 border-red-200",
};

const PAYMENT_STYLE: Record<string, string> = {
  paid:    "bg-green-50 text-green-700 border-green-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  failed:  "bg-red-50 text-red-700 border-red-200",
};

export default function Orders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListOrders({
    page, limit: 25,
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const updateOrder = useUpdateOrder();
  const { toast } = useToast();
  const qc = useQueryClient();

  const handleStatusChange = (orderId: number, newStatus: string, currentData: any) => {
    // Optimistic update — UI changes instantly
    qc.setQueriesData({ queryKey: getListOrdersQueryKey() }, (old: any) => {
      if (!old?.items) return old;
      return { ...old, items: old.items.map((o: any) => o.id === orderId ? { ...o, status: newStatus } : o) };
    });

    updateOrder.mutate({ id: orderId, data: { status: newStatus as any } }, {
      onSuccess: () => {
        toast({ title: "Status updated", description: `Order set to ${newStatus}` });
        qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      },
      onError: () => {
        // Revert on error
        qc.setQueriesData({ queryKey: getListOrdersQueryKey() }, (old: any) => {
          if (!old?.items) return old;
          return { ...old, items: old.items.map((o: any) => o.id === orderId ? { ...o, status: currentData.status } : o) };
        });
        toast({ title: "Update failed", variant: "destructive" });
      },
    });
  };

  const total = data?.total ?? 0;
  const start = (page - 1) * 25 + 1;
  const end = Math.min(page * 25, total);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Orders</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage customer orders and fulfilment status.</p>
        </div>
        <Badge variant="outline" className="text-xs font-normal">{total} orders</Badge>
      </div>

      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center gap-3 py-3 px-4 border-b">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by customer name…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
              {STATUSES.map(s => (
                <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-2 w-[120px]">Order #</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-2">Customer</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-2">City</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-2 text-right">Items</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-2 text-right">Total</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-2">Payment</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-2">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-2">Date</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-2 w-[140px]">Update Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.items || []).map(order => (
                      <TableRow key={order.id} className="hover:bg-muted/20 border-b last:border-0">
                        <TableCell className="py-2">
                          <code className="text-xs font-mono font-semibold text-primary">{order.orderNumber}</code>
                        </TableCell>
                        <TableCell className="py-2">
                          <p className="text-xs font-semibold leading-tight">{order.customerName}</p>
                          <p className="text-[11px] text-muted-foreground leading-tight">{order.customerEmail}</p>
                        </TableCell>
                        <TableCell className="py-2 text-xs">{(order as any).city || "—"}</TableCell>
                        <TableCell className="py-2 text-xs text-right">{(order as any).items ?? "—"}</TableCell>
                        <TableCell className="py-2 text-xs font-semibold text-right">{fmt(order.total)}</TableCell>
                        <TableCell className="py-2">
                          <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium capitalize ${PAYMENT_STYLE[(order as any).paymentStatus || ''] || "bg-muted text-muted-foreground border-border"}`}>
                            {order.paymentStatus}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[(order as any).status || ''] || "bg-muted text-muted-foreground border-border"}`}>
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 text-[11px] text-muted-foreground whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                        </TableCell>
                        <TableCell className="py-2">
                          <Select value={order.status} onValueChange={v => handleStatusChange(order.id, v, order)}>
                            <SelectTrigger className="h-7 w-[128px] text-[11px] border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map(s => (
                                <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!data?.items?.length && (
                      <TableRow>
                        <TableCell colSpan={9} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <ShoppingCart className="h-7 w-7" />
                            <p className="text-sm">{search ? "No orders match your search." : "No orders yet."}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 border-t bg-muted/10">
                <p className="text-[11px] text-muted-foreground">
                  {total > 0 ? `Showing ${start}–${end} of ${total} orders` : "No orders"}
                </p>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2.5" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>← Prev</Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2.5" onClick={() => setPage(p => p + 1)} disabled={!data?.items?.length || data.items.length < 25}>Next →</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
