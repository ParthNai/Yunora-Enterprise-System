import { useState } from "react";
import { useListBanners, useCreateBanner, useUpdateBanner, useDeleteBanner, getListBannersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ImageUpload } from "@/components/image-upload";

export default function Banners() {
  const { data: banners, isLoading } = useListBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", imageUrl: "", linkUrl: "", type: "homepage", isActive: true, priority: 1 });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createBanner.mutate({ data: form as any }, {
      onSuccess: () => {
        toast({ title: "Banner created" });
        qc.invalidateQueries({ queryKey: getListBannersQueryKey() });
        setOpen(false);
        setForm({ title: "", imageUrl: "", linkUrl: "", type: "homepage", isActive: true, priority: 1 });
      },
      onError: () => toast({ title: "Failed to create banner", variant: "destructive" }),
    });
  };

  const toggleActive = (id: number, isActive: boolean) => {
    updateBanner.mutate({ id, data: { isActive } as any }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListBannersQueryKey() }),
    });
  };

  const handleDelete = (id: number) => {
    deleteBanner.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Banner deleted" });
        qc.invalidateQueries({ queryKey: getListBannersQueryKey() });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banners</h1>
          <p className="text-muted-foreground">Manage promotional banners displayed on your storefront.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Banner</Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(banners || []).map((banner: any) => (
            <Card key={banner.id} className={!banner.isActive ? "opacity-60" : ""}>
              <div className="relative h-40 rounded-t-lg overflow-hidden bg-muted">
                {banner.imageUrl ? (
                  <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge variant="secondary" className="capitalize text-xs">{banner.type}</Badge>
                </div>
              </div>
              <CardContent className="pt-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{banner.title}</p>
                    {banner.linkUrl && (
                      <a href={banner.linkUrl} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 mt-0.5">
                        <ExternalLink className="h-3 w-3" /> {banner.linkUrl}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch checked={banner.isActive} onCheckedChange={v => toggleActive(banner.id, v)} />
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(banner.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Priority: {banner.priority}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && !banners?.length && (
        <Card><CardContent className="h-32 flex items-center justify-center text-muted-foreground">No banners yet. Add your first banner.</CardContent></Card>
      )}

      <Drawer open={open} onOpenChange={setOpen} direction="right">
        <DrawerContent className="w-full sm:w-[520px] h-full rounded-l-xl">
          <DrawerHeader><DrawerTitle>Add Banner</DrawerTitle></DrawerHeader>
          <form id="banner-form" onSubmit={handleCreate} className="p-4 space-y-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Summer Sale 2026" />
            </div>

            <ImageUpload
              label="Banner Image"
              value={form.imageUrl}
              onChange={url => setForm({ ...form, imageUrl: url })}
            />

            <div className="space-y-2">
              <Label>Link URL</Label>
              <Input value={form.linkUrl} onChange={e => setForm({ ...form, linkUrl: e.target.value })} placeholder="/categories/sofa or /offers/summer" />
            </div>

            <div className="space-y-2">
              <Label>Priority (lower = first)</Label>
              <Input type="number" min={1} value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })} />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
              <Label>Active</Label>
            </div>
          </form>
          <DrawerFooter>
            <Button type="submit" form="banner-form" disabled={createBanner.isPending}>
              {createBanner.isPending ? "Creating..." : "Create Banner"}
            </Button>
            <DrawerClose asChild><Button variant="outline">Cancel</Button></DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
