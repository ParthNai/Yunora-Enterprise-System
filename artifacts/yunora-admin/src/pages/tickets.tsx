import { useState } from "react";
import { useListTickets, useCreateTicket, useUpdateTicket, getListTicketsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, LifeBuoy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-700",
};

export default function Tickets() {
  const [status, setStatus] = useState("all");
  const { data: tickets, isLoading } = useListTickets({ status: status === "all" ? undefined : status });
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", customerName: "", customerEmail: "", type: "general", priority: "medium" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createTicket.mutate({ data: form as any }, {
      onSuccess: () => {
        toast({ title: "Ticket created" });
        qc.invalidateQueries({ queryKey: getListTicketsQueryKey() });
        setOpen(false);
        setForm({ subject: "", customerName: "", customerEmail: "", type: "general", priority: "medium" });
      },
    });
  };

  const updateStatus = (id: number, newStatus: string) => {
    updateTicket.mutate({ id, data: { status: newStatus as any } }, {
      onSuccess: () => {
        toast({ title: "Ticket updated" });
        qc.invalidateQueries({ queryKey: getListTicketsQueryKey() });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground">Manage customer support requests.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> New Ticket</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <LifeBuoy className="h-5 w-5 text-primary" />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tickets</SelectItem>
              {Object.keys(STATUS_COLORS).map(s => (
                <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(tickets || []).map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium max-w-[200px]">
                        <p className="truncate text-sm">{t.subject}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{t.customerName}</p>
                        <p className="text-xs text-muted-foreground">{t.customerEmail}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="capitalize text-xs">{t.type?.replace("_", " ")}</Badge></TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PRIORITY_COLORS[t.priority] || ""}`}>
                          {t.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[t.status] || ""}`}>
                          {t.status?.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <Select defaultValue={t.status} onValueChange={v => updateStatus(t.id, v)}>
                          <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.keys(STATUS_COLORS).map(s => (
                              <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace("_", " ")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!tickets?.length && (
                    <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No tickets found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Drawer open={open} onOpenChange={setOpen} direction="right">
        <DrawerContent className="w-full sm:w-[480px] h-full rounded-l-xl">
          <DrawerHeader><DrawerTitle>New Ticket</DrawerTitle></DrawerHeader>
          <form onSubmit={handleCreate} className="p-4 space-y-4 overflow-y-auto">
            <div className="space-y-2"><Label>Subject</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Customer Name</Label><Input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Customer Email</Label><Input type="email" value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} required /></div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["general","delivery","warranty","product_support","billing","other"].map(t => (
                    <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["low","medium","high","urgent"].map(p => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DrawerFooter className="px-0">
              <Button type="submit" disabled={createTicket.isPending}>{createTicket.isPending ? "Creating..." : "Create Ticket"}</Button>
              <DrawerClose asChild><Button variant="outline">Cancel</Button></DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
