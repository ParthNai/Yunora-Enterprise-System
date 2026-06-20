import { useState } from "react";
import { useListDealers, useCreateDealer, useUpdateDealer, getListDealersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Building2, CheckCircle, XCircle, Phone, Mail, MapPin, Percent, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
};

export default function Dealers() {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListDealers({ page, status: status === "all" ? undefined : status } as any);
  const createDealer = useCreateDealer();
  const updateDealer = useUpdateDealer();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ businessName: "", contactName: "", email: "", phone: "", city: "", discountPercent: 10 });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createDealer.mutate({ data: form as any }, {
      onSuccess: () => {
        toast({ title: "Dealer added successfully" });
        qc.invalidateQueries({ queryKey: getListDealersQueryKey() });
        setOpen(false);
        setForm({ businessName: "", contactName: "", email: "", phone: "", city: "", discountPercent: 10 });
      },
      onError: () => toast({ title: "Failed to add dealer", variant: "destructive" }),
    });
  };

  const changeStatus = (id: number, newStatus: string) => {
    updateDealer.mutate({ id, data: { status: newStatus } as any }, {
      onSuccess: () => {
        toast({ title: `Dealer ${newStatus}` });
        qc.invalidateQueries({ queryKey: getListDealersQueryKey() });
        setSelected(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dealers</h1>
          <p className="text-muted-foreground">Manage B2B dealer partnerships — {data?.total ?? 0} dealers.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Dealer</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Business</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.items || []).map((d: any) => (
                      <TableRow key={d.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelected(d)}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              <Building2 className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{d.businessName}</p>
                              <p className="text-xs text-muted-foreground">{d.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{d.contactName}</TableCell>
                        <TableCell className="text-sm">{d.city || "—"}</TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 text-xs font-semibold">
                            {d.discountPercent}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">{d.totalOrders ?? 0}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[d.status] || "bg-gray-100 text-gray-600"}`}>
                            {d.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            {d.status === "pending" && (
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 text-xs" onClick={() => changeStatus(d.id, "approved")}>
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />Approve
                              </Button>
                            )}
                            {d.status === "approved" && (
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs" onClick={() => changeStatus(d.id, "suspended")}>
                                <XCircle className="h-3.5 w-3.5 mr-1" />Suspend
                              </Button>
                            )}
                            {d.status === "suspended" && (
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 text-xs" onClick={() => changeStatus(d.id, "approved")}>
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />Reinstate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!data?.items?.length && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Building2 className="h-8 w-8" />
                            <p className="text-sm">No dealers found.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between pt-3">
                <p className="text-sm text-muted-foreground">Total: {data?.total ?? 0} dealers</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p+1)} disabled={!data?.items?.length || data.items.length < 20}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Dealer Drawer */}
      <Drawer open={open} onOpenChange={setOpen} direction="right">
        <DrawerContent className="w-full sm:w-[480px] h-full rounded-l-2xl flex flex-col">
          <DrawerHeader className="border-b px-6 py-4">
            <DrawerTitle>Add Dealer</DrawerTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Register a new B2B dealer partner.</p>
          </DrawerHeader>
          <form onSubmit={handleCreate} className="flex-1 p-6 space-y-4 overflow-y-auto">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Business Name *</Label>
              <Input value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} placeholder="ABC Furniture Co." required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Contact Person *</Label>
              <Input value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} placeholder="Rajesh Kumar" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email *</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="dealer@abc.in" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Phone</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">City *</Label>
                <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Mumbai" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Discount %</Label>
                <Input type="number" min={0} max={50} value={form.discountPercent} onChange={e => setForm({ ...form, discountPercent: Number(e.target.value) })} />
              </div>
            </div>
            <DrawerFooter className="px-0 pt-4">
              <Button type="submit" disabled={createDealer.isPending}>{createDealer.isPending ? "Adding…" : "Add Dealer"}</Button>
              <DrawerClose asChild><Button variant="outline" type="button">Cancel</Button></DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      {/* Dealer Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={v => { if (!v) setSelected(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dealer Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{selected.businessName}</p>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[selected.status]}`}>
                    {selected.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2.5"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${selected.email}`} className="text-primary hover:underline">{selected.email}</a></div>
                  {selected.phone && <div className="flex items-center gap-2.5"><Phone className="h-4 w-4 text-muted-foreground" /><span>{selected.phone}</span></div>}
                  {selected.city && <div className="flex items-center gap-2.5"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{selected.city}</span></div>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border bg-muted/30 p-3 text-center">
                  <Percent className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xl font-bold">{selected.discountPercent}%</p>
                  <p className="text-xs text-muted-foreground">Discount</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3 text-center">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xl font-bold">{selected.totalOrders ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3 text-center">
                  <Building2 className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-sm font-bold capitalize">{selected.status}</p>
                  <p className="text-xs text-muted-foreground">Status</p>
                </div>
              </div>

              <div className="flex gap-2">
                {selected.status === "pending" && (
                  <Button className="flex-1" onClick={() => changeStatus(selected.id, "approved")} disabled={updateDealer.isPending}>
                    <CheckCircle className="h-4 w-4 mr-1.5" />Approve
                  </Button>
                )}
                {selected.status === "approved" && (
                  <Button variant="destructive" className="flex-1" onClick={() => changeStatus(selected.id, "suspended")} disabled={updateDealer.isPending}>
                    <XCircle className="h-4 w-4 mr-1.5" />Suspend
                  </Button>
                )}
                {selected.status === "suspended" && (
                  <Button className="flex-1" onClick={() => changeStatus(selected.id, "approved")} disabled={updateDealer.isPending}>
                    <CheckCircle className="h-4 w-4 mr-1.5" />Reinstate
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
