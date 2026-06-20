import { useState } from "react";
import { useListOffers, useCreateOffer, useUpdateOffer, useDeleteOffer, getListOffersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Tag, Edit, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Offers() {
  const { data: offers, isLoading } = useListOffers();
  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();
  const deleteOffer = useDeleteOffer();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({ text: "", isActive: true, priority: 1 });

  const openAdd = () => {
    setForm({ text: "", isActive: true, priority: (offers?.length ?? 0) + 1 });
    setEditTarget(null);
    setOpen(true);
  };

  const openEdit = (offer: any) => {
    setForm({ text: offer.text, isActive: offer.isActive, priority: offer.priority });
    setEditTarget(offer);
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editTarget) {
      updateOffer.mutate({ id: editTarget.id, data: form as any }, {
        onSuccess: () => {
          toast({ title: "Offer updated" });
          qc.invalidateQueries({ queryKey: getListOffersQueryKey() });
          setOpen(false);
        },
      });
    } else {
      createOffer.mutate({ data: form as any }, {
        onSuccess: () => {
          toast({ title: "Offer created" });
          qc.invalidateQueries({ queryKey: getListOffersQueryKey() });
          setOpen(false);
          setForm({ text: "", isActive: true, priority: 1 });
        },
        onError: () => toast({ title: "Failed", variant: "destructive" }),
      });
    }
  };

  const toggleActive = (offer: any) => {
    // Optimistic toggle
    qc.setQueryData(getListOffersQueryKey(), (old: any) =>
      Array.isArray(old) ? old.map((o: any) => o.id === offer.id ? { ...o, isActive: !o.isActive } : o) : old
    );
    updateOffer.mutate({ id: offer.id, data: { isActive: !offer.isActive } as any }, {
      onError: () => {
        qc.invalidateQueries({ queryKey: getListOffersQueryKey() });
        toast({ title: "Failed", variant: "destructive" });
      },
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteOffer.mutate({ id: deleteTarget.id }, {
      onSuccess: () => {
        toast({ title: "Offer deleted" });
        qc.invalidateQueries({ queryKey: getListOffersQueryKey() });
        setDeleteTarget(null);
      },
    });
  };

  const isPending = createOffer.isPending || updateOffer.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Offers</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage announcement bar offers shown on your storefront.</p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5" /> Add Offer
        </Button>
      </div>

      <Card className="shadow-none">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
                      <TableHead className="text-[10px] uppercase tracking-wide py-2 font-semibold w-8"></TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wide py-2 font-semibold">Offer Text</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wide py-2 font-semibold text-center w-20">Priority</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wide py-2 font-semibold text-center w-24">Status</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wide py-2 font-semibold text-right w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(offers || []).map((offer: any) => (
                      <TableRow key={offer.id} className={`hover:bg-muted/20 border-b last:border-0 ${!offer.isActive ? "opacity-55" : ""}`}>
                        <TableCell className="py-2 pl-3">
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-xs font-medium">{offer.text}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                            {offer.priority}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Switch
                              checked={offer.isActive}
                              onCheckedChange={() => toggleActive(offer)}
                              className="scale-75 origin-center"
                            />
                            <span className={`text-[10px] font-medium ${offer.isActive ? "text-green-600" : "text-muted-foreground"}`}>
                              {offer.isActive ? "Active" : "Off"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(offer)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(offer)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!offers?.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-28 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Tag className="h-7 w-7" />
                            <p className="text-xs">No offers yet. Add your first announcement bar offer.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {(offers?.length ?? 0) > 0 && (
                <div className="px-4 py-2 border-t bg-muted/10">
                  <p className="text-[11px] text-muted-foreground">{offers?.length} offer{(offers?.length ?? 0) !== 1 ? "s" : ""} · {(offers || []).filter((o: any) => o.isActive).length} active</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Drawer */}
      <Drawer open={open} onOpenChange={v => { if (!v) setOpen(false); }} direction="right">
        <DrawerContent className="w-full sm:w-[420px] h-full rounded-l-2xl flex flex-col">
          <DrawerHeader className="border-b px-6 py-4">
            <DrawerTitle>{editTarget ? "Edit Offer" : "Add Offer"}</DrawerTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {editTarget ? "Update this announcement bar offer." : "Create a new announcement bar offer."}
            </p>
          </DrawerHeader>
          <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4 overflow-y-auto">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Offer Text *</Label>
              <Input
                value={form.text}
                onChange={e => setForm({ ...form, text: e.target.value })}
                placeholder="FREE SHIPPING on orders above ₹50,000"
                required
              />
              <p className="text-[10px] text-muted-foreground">This text appears in the announcement bar on your website.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Priority</Label>
              <Input
                type="number" min={1}
                value={form.priority}
                onChange={e => setForm({ ...form, priority: Number(e.target.value) })}
              />
              <p className="text-[10px] text-muted-foreground">Lower number = shown first. Use 1 for highest priority.</p>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
              <div>
                <p className="text-xs font-medium">Active</p>
                <p className="text-[10px] text-muted-foreground">{form.isActive ? "Visible on storefront" : "Hidden from storefront"}</p>
              </div>
            </div>
            <DrawerFooter className="px-0 pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? (editTarget ? "Saving…" : "Creating…") : (editTarget ? "Save Changes" : "Create Offer")}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Offer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the offer "<strong>{deleteTarget?.text}</strong>" from your storefront.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteOffer.isPending}
            >
              {deleteOffer.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
