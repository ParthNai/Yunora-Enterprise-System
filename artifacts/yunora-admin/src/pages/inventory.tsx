import { useState } from "react";
import { useListInventory, useListWarehouses } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Warehouse } from "lucide-react";

export default function Inventory() {
  const [warehouseId, setWarehouseId] = useState("all");
  const [lowStock, setLowStock] = useState(false);
  const { data: warehouses } = useListWarehouses();
  const { data: inventory, isLoading } = useListInventory({
    warehouseId: warehouseId === "all" ? undefined : Number(warehouseId),
    lowStock: lowStock || undefined,
  });

  const lowStockCount = (inventory || []).filter((i: any) => i.isLowStock).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">Track stock levels across warehouses.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(warehouses || []).map((w: any) => (
          <Card key={w.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setWarehouseId(String(w.id))}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Warehouse className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{w.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{w.city}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">{lowStockCount} item{lowStockCount > 1 ? "s" : ""} running low on stock</span>
          <Button variant="link" size="sm" className="text-yellow-800 p-0 h-auto" onClick={() => setLowStock(!lowStock)}>
            {lowStock ? "Show all" : "Show low stock only"}
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <Select value={warehouseId} onValueChange={setWarehouseId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All Warehouses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Warehouses</SelectItem>
              {(warehouses || []).map((w: any) => (
                <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Low Stock Threshold</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(inventory || []).map((item: any) => (
                    <TableRow key={item.id} className={item.isLowStock ? "bg-red-50/50" : ""}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                      <TableCell className="text-sm">{item.warehouseName}</TableCell>
                      <TableCell>
                        <span className={`font-bold text-lg ${item.isLowStock ? "text-red-600" : "text-green-600"}`}>
                          {item.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.lowStockThreshold}</TableCell>
                      <TableCell>
                        {item.isLowStock ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" /> Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">In Stock</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!inventory?.length && (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No inventory records.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
