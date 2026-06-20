import { useState } from "react";
import { useListCoupons, useCreateCoupon, useDeleteCoupon, getListCouponsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Copy, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function Coupons() {
  const { data: coupons, isLoading } = useListCoupons();
  const createCoupon = useCreateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", type: "percentage", value: 10, minOrderAmount: 0, usageLimit: 100, isActive: true });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createCoupon.mutate({ data: form as any }, {
      onSuccess: () => {
        toast({ title: "Coupon created" });
        qc.invalidateQueries({ queryKey: getListCouponsQueryKey() });
        setOpen(false);
      },
      onError: () => toast({ title: "Failed", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">Create and manage discount coupons.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Create Coupon</Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Min Order</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(coupons || []).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-0.5 rounded text-sm font-mono font-bold">{c.code}</code>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(c.code); toast({ title: "Copied!" }); }}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{c.type}</Badge></TableCell>
                      <TableCell className="font-medium text-primary">
                        {c.type === "percentage" ? `${c.value}%` : fmt(c.value)}
                      </TableCell>
                      <TableCell className="text-sm">{c.minOrderAmount ? fmt(c.minOrderAmount) : "—"}</TableCell>
                      <TableCell className="text-sm">{c.usageCount ?? 0} / {c.usageLimit ?? "∞"}</TableCell>
                      <TableCell>
                        <Badge variant={c.isActive ? "default" : "secondary"}>{c.isActive ? "Active" : "Inactive"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => deleteCoupon.mutate({ id: c.id }, { onSuccess: () => { toast({ title: "Deleted" }); qc.invalidateQueries({ queryKey: getListCouponsQueryKey() }); } })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!coupons?.length && (
                    <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No coupons yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Drawer open={open} onOpenChange={setOpen} direction="right">
        <DrawerContent className="w-full sm:w-[480px] h-full rounded-l-xl">
          <DrawerHeader><DrawerTitle>Create Coupon</DrawerTitle></DrawerHeader>
          <form onSubmit={handleCreate} className="p-4 space-y-4 overflow-y-auto">
            <div className="space-y-2"><Label>Coupon Code</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="DIWALI25" required /></div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Value</Label><Input type="number" min={0} value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Minimum Order (₹)</Label><Input type="number" min={0} value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Usage Limit</Label><Input type="number" min={1} value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: Number(e.target.value) })} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} /><Label>Active</Label></div>
            <DrawerFooter className="px-0">
              <Button type="submit" disabled={createCoupon.isPending}>{createCoupon.isPending ? "Creating..." : "Create Coupon"}</Button>
              <DrawerClose asChild><Button variant="outline">Cancel</Button></DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
