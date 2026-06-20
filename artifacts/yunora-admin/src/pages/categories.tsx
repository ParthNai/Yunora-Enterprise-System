import { useState } from "react";
import { useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, FolderOpen, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Categories() {
  const { data: categories, isLoading } = useListCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [drawerMode, setDrawerMode] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });

  const openAdd = () => { setForm({ name: "", slug: "", description: "" }); setDrawerMode("add"); };
  const openEdit = (cat: any) => { setEditTarget(cat); setForm({ name: cat.name, slug: cat.slug, description: cat.description || "" }); setDrawerMode("edit"); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (drawerMode === "edit" && editTarget) {
      updateCategory.mutate({ id: editTarget.id, data: form as any }, {
        onSuccess: () => {
          toast({ title: "Category updated" });
          qc.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          setDrawerMode(null);
        },
        onError: () => toast({ title: "Failed", variant: "destructive" }),
      });
    } else {
      createCategory.mutate({ data: form as any }, {
        onSuccess: () => {
          toast({ title: "Category created" });
          qc.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          setDrawerMode(null);
        },
        onError: () => toast({ title: "Failed", variant: "destructive" }),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteCategory.mutate({ id: deleteTarget.id }, {
      onSuccess: () => {
        toast({ title: "Category deleted" });
        qc.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
        setDeleteTarget(null);
      },
      onError: () => toast({ title: "Cannot delete — may have linked products", variant: "destructive" }),
    });
  };

  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Organise your product taxonomy — {(categories || []).length} categories.</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" /> Add Category</Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(categories || []).map((cat: any) => (
                    <TableRow key={cat.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FolderOpen className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium text-sm">{cat.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><code className="bg-muted text-xs px-2 py-0.5 rounded font-mono">{cat.slug}</code></TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{cat.description || "—"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-xs font-medium">
                          {cat.productCount ?? 0} products
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(cat)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!categories?.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-28 text-center text-muted-foreground text-sm">
                        No categories yet. Add your first one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Drawer */}
      <Drawer open={drawerMode !== null} onOpenChange={v => { if (!v) setDrawerMode(null); }} direction="right">
        <DrawerContent className="w-full sm:w-[420px] h-full rounded-l-2xl flex flex-col">
          <DrawerHeader className="border-b px-6 py-4">
            <DrawerTitle>{drawerMode === "edit" ? "Edit Category" : "Add Category"}</DrawerTitle>
          </DrawerHeader>
          <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4 overflow-y-auto">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Name *</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value, slug: drawerMode === "add" ? e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") : form.slug })}
                placeholder="e.g. Sofas & Sectionals"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Slug *</Label>
              <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="sofas-sectionals" required />
              <p className="text-xs text-muted-foreground">Used in URLs — only letters, numbers and hyphens.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short description of this category…" rows={3} />
            </div>
            <DrawerFooter className="px-0 pt-4">
              <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : drawerMode === "edit" ? "Save Changes" : "Create Category"}</Button>
              <DrawerClose asChild><Button variant="outline" type="button">Cancel</Button></DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? Products in this category will become uncategorised.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete} disabled={deleteCategory.isPending}>
              {deleteCategory.isPending ? "Deleting…" : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
