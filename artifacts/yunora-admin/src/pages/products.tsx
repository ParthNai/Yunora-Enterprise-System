import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
  useListCategories, getListProductsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2, Eye, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  draft: "bg-yellow-100 text-yellow-700 border-yellow-200",
  archived: "bg-gray-100 text-gray-600 border-gray-200",
};

type ProductForm = {
  name: string; sku: string; price: string; comparePrice: string;
  stock: string; brand: string; categoryId: string; status: string;
  description: string; imageUrl: string;
};

const emptyForm: ProductForm = {
  name: "", sku: "", price: "", comparePrice: "", stock: "", brand: "",
  categoryId: "", status: "draft", description: "", imageUrl: "",
};

export default function Products() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListProducts({ page, limit: 15, search });
  const [, setLocation] = useLocation();
  const [drawerMode, setDrawerMode] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  function openAdd() { setEditTarget(null); setDrawerMode("add"); }
  function openEdit(product: any) { setEditTarget(product); setDrawerMode("edit"); }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product catalogue — {data?.total ?? 0} products total.</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
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
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.items || []).map((product) => (
                      <TableRow key={product.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-lg object-cover bg-muted flex-shrink-0" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              {(product as any).brand && <p className="text-xs text-muted-foreground">{(product as any).brand}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{product.sku}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{product.categoryName || "—"}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-sm">{fmt(product.price)}</p>
                            {(product as any).comparePrice && (
                              <p className="text-xs text-muted-foreground line-through">{fmt((product as any).comparePrice)}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${product.stock === 0 ? "text-red-600" : product.stock < 10 ? "text-amber-600" : "text-foreground"}`}>
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[product.status] || "bg-gray-100 text-gray-600"}`}>
                            {product.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLocation(`/products/${product.id}`)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(product)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!data?.items?.length && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Package className="h-8 w-8" />
                            <p className="text-sm">{search ? "No products match your search." : "No products yet. Add your first product."}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between pt-3">
                <p className="text-sm text-muted-foreground">
                  Showing {Math.min((page - 1) * 15 + 1, data?.total || 0)}–{Math.min(page * 15, data?.total || 0)} of {data?.total ?? 0}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!data?.items?.length || data.items.length < 15}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ProductDrawer
        mode={drawerMode}
        product={editTarget}
        onClose={() => setDrawerMode(null)}
      />

      <DeleteDialog
        product={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function ProductDrawer({ mode, product, onClose }: { mode: "add" | "edit" | null; product: any; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: categories } = useListCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const isOpen = mode !== null;

  const initForm = (p: any) => setForm({
    name: p?.name || "", sku: p?.sku || "", price: p?.price?.toString() || "",
    comparePrice: p?.comparePrice?.toString() || "", stock: p?.stock?.toString() || "",
    brand: p?.brand || "", categoryId: p?.categoryId?.toString() || "",
    status: p?.status || "draft", description: p?.description || "", imageUrl: p?.imageUrl || "",
  });

  const set = (k: keyof ProductForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name, sku: form.sku, price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      stock: Number(form.stock), brand: form.brand || undefined,
      categoryId: form.categoryId ? Number(form.categoryId) : undefined,
      status: form.status as any,
      description: form.description || undefined, imageUrl: form.imageUrl || undefined,
    };
    if (mode === "edit" && product) {
      updateProduct.mutate({ id: product.id, data: payload as any }, {
        onSuccess: () => {
          toast({ title: "Product updated" });
          qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
          onClose();
        },
        onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
      });
    } else {
      createProduct.mutate({ data: payload as any }, {
        onSuccess: () => {
          toast({ title: "Product created" });
          qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
          onClose();
          setForm(emptyForm);
        },
        onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
      });
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(v) => { if (!v) onClose(); else if (mode === "edit") initForm(product); }}
      direction="right"
    >
      <DrawerContent className="w-full sm:w-[520px] h-full rounded-l-2xl flex flex-col">
        <DrawerHeader className="border-b px-6 py-4">
          <DrawerTitle>{mode === "edit" ? "Edit Product" : "Add New Product"}</DrawerTitle>
          <p className="text-sm text-muted-foreground mt-0.5">{mode === "edit" ? `Editing: ${product?.name}` : "Fill in the details below to add a product."}</p>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Basic Info */}
            <Section title="Basic Information">
              <Field label="Product Name *">
                <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Royal Teak Sofa Set" required />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="SKU *">
                  <Input value={form.sku} onChange={e => set("sku", e.target.value.toUpperCase())} placeholder="YNR-SF-001" required />
                </Field>
                <Field label="Brand">
                  <Input value={form.brand} onChange={e => set("brand", e.target.value)} placeholder="Yunora" />
                </Field>
              </div>
              <Field label="Description">
                <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Brief product description…" rows={3} />
              </Field>
            </Section>

            {/* Pricing */}
            <Section title="Pricing">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Selling Price (₹) *">
                  <Input type="number" min={0} step={0.01} value={form.price} onChange={e => set("price", e.target.value)} placeholder="15000" required />
                </Field>
                <Field label="MRP / Compare Price (₹)">
                  <Input type="number" min={0} step={0.01} value={form.comparePrice} onChange={e => set("comparePrice", e.target.value)} placeholder="18000" />
                </Field>
              </div>
            </Section>

            {/* Inventory */}
            <Section title="Inventory &amp; Category">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Stock Quantity *">
                  <Input type="number" min={0} value={form.stock} onChange={e => set("stock", e.target.value)} placeholder="50" required />
                </Field>
                <Field label="Status">
                  <Select value={form.status} onValueChange={v => set("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Category">
                <Select value={form.categoryId} onValueChange={v => set("categoryId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {(categories || []).map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </Section>

            {/* Image */}
            <Section title="Product Image">
              <Field label="Image URL">
                <Input value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)} placeholder="https://example.com/image.jpg" />
              </Field>
              {form.imageUrl && (
                <img src={form.imageUrl} alt="Preview" className="mt-2 h-32 w-full object-cover rounded-lg border" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
            </Section>
          </div>

          <DrawerFooter className="border-t px-6 py-4 bg-muted/20">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (mode === "edit" ? "Saving…" : "Creating…") : (mode === "edit" ? "Save Changes" : "Create Product")}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" type="button" className="w-full" onClick={onClose}>Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

function DeleteDialog({ product, onClose }: { product: any; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const deleteProduct = useDeleteProduct();

  const handleDelete = () => {
    deleteProduct.mutate({ id: product.id }, {
      onSuccess: () => {
        toast({ title: "Product deleted" });
        qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
        onClose();
      },
      onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <AlertDialog open={!!product} onOpenChange={(v) => { if (!v) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Product?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{product?.name}</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDelete}
            disabled={deleteProduct.isPending}
          >
            {deleteProduct.isPending ? "Deleting…" : "Yes, Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
