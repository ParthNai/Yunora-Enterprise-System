import { useState } from "react";
import { useListLeads, useCreateLead, useUpdateLead, getListLeadsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  interested: "bg-purple-100 text-purple-800",
  follow_up: "bg-orange-100 text-orange-800",
  converted: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};

export default function Leads() {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListLeads({ page, status: status === "all" ? undefined : status } as any);
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", source: "contact_form", status: "new", notes: "" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createLead.mutate({ data: form as any }, {
      onSuccess: () => {
        toast({ title: "Lead added" });
        qc.invalidateQueries({ queryKey: getListLeadsQueryKey() });
        setOpen(false);
        setForm({ name: "", email: "", phone: "", source: "contact_form", status: "new", notes: "" });
      },
    });
  };

  const updateStatus = (id: number, newStatus: string) => {
    updateLead.mutate({ id, data: { status: newStatus as any } }, {
      onSuccess: () => {
        toast({ title: "Lead updated" });
        qc.invalidateQueries({ queryKey: getListLeadsQueryKey() });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">CRM — track and convert potential customers.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Lead</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leads</SelectItem>
              {Object.keys(STATUS_COLORS).map(s => (
                <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
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
                    <TableHead>Lead</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Update</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.items || []).map((lead: any) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{lead.name}</p>
                            <p className="text-xs text-muted-foreground">{lead.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{lead.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">{lead.source?.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-xs text-muted-foreground truncate">{lead.notes || "—"}</p>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[lead.status] || ""}`}>
                          {lead.status?.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select defaultValue={lead.status} onValueChange={v => updateStatus(lead.id, v)}>
                          <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.keys(STATUS_COLORS).map(s => (
                              <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace("_", " ")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!data?.items?.length && (
                    <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No leads found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Drawer open={open} onOpenChange={setOpen} direction="right">
        <DrawerContent className="w-full sm:w-[480px] h-full rounded-l-xl">
          <DrawerHeader><DrawerTitle>Add Lead</DrawerTitle></DrawerHeader>
          <form onSubmit={handleCreate} className="p-4 space-y-4 overflow-y-auto">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["contact_form","whatsapp","dealer_form","product_inquiry","call_request","walk_in"].map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <DrawerFooter className="px-0">
              <Button type="submit" disabled={createLead.isPending}>{createLead.isPending ? "Adding..." : "Add Lead"}</Button>
              <DrawerClose asChild><Button variant="outline">Cancel</Button></DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
