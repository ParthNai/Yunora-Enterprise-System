import { useState } from "react";
import { useListCustomers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, User, Mail, Phone, MapPin, ShoppingBag, IndianRupee, Calendar } from "lucide-react";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function Customers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListCustomers({ page, search: search || undefined } as any);
  const [selected, setSelected] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">View and manage your customer base — {data?.total ?? 0} customers total.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, email or phone…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Total Spent</TableHead>
                      <TableHead>Last Order</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.items || []).map((c: any) => (
                      <TableRow key={c.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelected(c)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-sm font-bold text-primary">{c.name?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{c.name}</p>
                              <p className="text-xs text-muted-foreground">{c.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{c.phone || "—"}</TableCell>
                        <TableCell className="text-sm">{c.city || "—"}</TableCell>
                        <TableCell className="text-sm font-semibold text-right">{c.totalOrders ?? 0}</TableCell>
                        <TableCell className="font-semibold text-right">{fmt(c.totalSpent ?? 0)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("en-IN") : "Never"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={c.status === "active" ? "default" : "secondary"} className="capitalize text-xs">
                            {c.status || "active"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!data?.items?.length && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <User className="h-8 w-8" />
                            <p className="text-sm">{search ? "No customers match your search." : "No customers yet."}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between pt-3">
                <p className="text-sm text-muted-foreground">
                  Showing {Math.min((page-1)*20+1, data?.total||0)}–{Math.min(page*20, data?.total||0)} of {data?.total ?? 0}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p+1)} disabled={!data?.items?.length || data.items.length < 20}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={!!selected} onOpenChange={v => { if (!v) setSelected(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              {/* Avatar + Name */}
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">{selected.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-semibold text-lg">{selected.name}</p>
                  <Badge variant={selected.status === "active" ? "default" : "secondary"} className="capitalize text-xs mt-0.5">
                    {selected.status || "active"}
                  </Badge>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`mailto:${selected.email}`} className="text-primary hover:underline">{selected.email}</a>
                  </div>
                  {selected.phone && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a href={`tel:${selected.phone}`} className="hover:underline">{selected.phone}</a>
                    </div>
                  )}
                  {selected.city && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{selected.city}{selected.state ? `, ${selected.state}` : ""}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border bg-muted/30 p-3 text-center">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xl font-bold">{selected.totalOrders ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3 text-center">
                  <IndianRupee className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xl font-bold">
                    {(selected.totalSpent ?? 0) >= 100000
                      ? `₹${((selected.totalSpent ?? 0) / 100000).toFixed(1)}L`
                      : `₹${((selected.totalSpent ?? 0) / 1000).toFixed(0)}K`}
                  </p>
                  <p className="text-xs text-muted-foreground">Spent</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3 text-center">
                  <Calendar className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-sm font-bold">
                    {selected.lastOrderAt ? new Date(selected.lastOrderAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Never"}
                  </p>
                  <p className="text-xs text-muted-foreground">Last order</p>
                </div>
              </div>

              {selected.address && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Address</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selected.address}</p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Customer since {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" }) : "—"}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
