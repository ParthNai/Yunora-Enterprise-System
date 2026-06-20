import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetProduct, useUpdateProduct, useListCategories, getGetProductQueryKey, getListProductsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit2, Save, X, Package } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-100 text-gray-600",
};

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const [, setLocation] = useLocation();
  const id = Number(params?.id);
  const { data: product, isLoading } = useGetProduct(id, { query: { enabled: !!id, queryKey: getGetProductQueryKey(id) } });
  const { data: categories } = useListCategories();
  const updateProduct = useUpdateProduct();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name, sku: product.sku, price: product.price,
        comparePrice: (product as any).comparePrice || "",
        stock: product.stock, brand: (product as any).brand || "",
        categoryId: (product as any).categoryId?.toString() || "",
        status: product.status, description: product.description || "",
        imageUrl: product.imageUrl || "",
      });
    }
  }, [product]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSave = () => {
    updateProduct.mutate({
      id,
      data: {
        name: form.name, sku: form.sku, price: Number(form.price),
        stock: Number(form.stock), brand: form.brand || undefined,
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        status: form.status as any, description: form.description || undefined,
        imageUrl: form.imageUrl || undefined,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Product saved successfully" });
        qc.invalidateQueries({ queryKey: getGetProductQueryKey(id) });
        qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setEditing(false);
      },
      onError: (e: any) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="md:col-span-2 h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <Package className="h-10 w-10" />
        <p>Product not found.</p>
        <Button variant="outline" onClick={() => setLocation("/products")}>Back to Products</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/products"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[product.status] || "bg-gray-100 text-gray-600"}`}>
                {product.status}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">SKU: <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{product.sku}</code></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={updateProduct.isPending}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={updateProduct.isPending}>
                <Save className="h-4 w-4 mr-1" /> {updateProduct.isPending ? "Saving…" : "Save"}
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setEditing(true)}>
              <Edit2 className="h-4 w-4 mr-1" /> Edit Product
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Details */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Product Details</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {editing ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Product Name</Label>
                  <Input value={form.name} onChange={e => set("name", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">SKU</Label>
                    <Input value={form.sku} onChange={e => set("sku", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Brand</Label>
                    <Input value={form.brand} onChange={e => set("brand", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Selling Price (₹)</Label>
                    <Input type="number" min={0} value={form.price} onChange={e => set("price", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Compare Price / MRP (₹)</Label>
                    <Input type="number" min={0} value={form.comparePrice} onChange={e => set("comparePrice", e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Stock Quantity</Label>
                    <Input type="number" min={0} value={form.stock} onChange={e => set("stock", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Status</Label>
                    <Select value={form.status} onValueChange={v => set("status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select value={form.categoryId} onValueChange={v => set("categoryId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {(categories || []).map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Image URL</Label>
                  <Input value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)} placeholder="https://…" />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <InfoRow label="Category" value={product.categoryName || "None"} />
                  <InfoRow label="Brand" value={(product as any).brand || "None"} />
                  <InfoRow label="Selling Price" value={fmt(product.price)} />
                  <InfoRow label="MRP / Compare" value={(product as any).comparePrice ? fmt((product as any).comparePrice) : "—"} />
                  <InfoRow label="Stock" value={`${product.stock} units`} accent={product.stock === 0 ? "text-red-600 font-bold" : product.stock < 10 ? "text-amber-600" : undefined} />
                  <InfoRow label="Status" value={product.status} className="capitalize" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Description</p>
                  <p className="text-sm leading-relaxed">{product.description || "No description provided."}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Image */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Product Image</CardTitle></CardHeader>
            <CardContent>
              {(editing ? form.imageUrl : product.imageUrl) ? (
                <img
                  src={editing ? form.imageUrl : product.imageUrl}
                  alt={product.name}
                  className="w-full aspect-square object-cover rounded-lg border"
                  onError={e => { (e.target as HTMLImageElement).parentElement!.innerHTML = "<div class='w-full aspect-square bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground'>Image failed to load</div>"; }}
                />
              ) : (
                <div className="w-full aspect-square bg-muted rounded-lg flex flex-col items-center justify-center gap-2">
                  <Package className="h-8 w-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">No image</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 space-y-3">
              <InfoRow label="Created" value={new Date((product as any).createdAt).toLocaleDateString("en-IN")} />
              <InfoRow label="Updated" value={new Date((product as any).updatedAt || (product as any).createdAt).toLocaleDateString("en-IN")} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, accent, className }: { label: string; value: string; accent?: string; className?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-sm font-medium ${accent || ""} ${className || ""}`}>{value}</p>
    </div>
  );
}
