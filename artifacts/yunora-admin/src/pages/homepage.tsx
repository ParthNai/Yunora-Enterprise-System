import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { ImageUpload } from "@/components/image-upload";
import { apiFetch } from "@/lib/api";

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero Banner",
  featured_products: "Featured Products",
  testimonials: "Testimonials",
  about: "About Section",
  usp: "USP / Feature Highlights",
  newsletter: "Newsletter Banner",
  custom: "Custom Section",
};

const SECTION_COLORS: Record<string, string> = {
  hero: "bg-orange-100 text-orange-800",
  featured_products: "bg-blue-100 text-blue-800",
  testimonials: "bg-green-100 text-green-800",
  about: "bg-purple-100 text-purple-800",
  usp: "bg-yellow-100 text-yellow-800",
  newsletter: "bg-pink-100 text-pink-800",
  custom: "bg-gray-100 text-gray-800",
};

type Section = {
  id: number;
  sectionType: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  buttonText: string | null;
  isActive: boolean;
  sortOrder: number;
};

const emptyForm = {
  sectionType: "hero",
  title: "",
  subtitle: "",
  content: "",
  imageUrl: "",
  linkUrl: "",
  buttonText: "",
  isActive: true,
  sortOrder: 0,
};

export default function Homepage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);

  const { data: sections, isLoading } = useQuery<Section[]>({
    queryKey: ["/api/homepage-sections"],
    queryFn: () => apiFetch("/api/homepage-sections").then(r => r.json()),
  });

  const createSection = useMutation({
    mutationFn: (data: typeof emptyForm) =>
      apiFetch("/api/homepage-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Section created" });
      qc.invalidateQueries({ queryKey: ["/api/homepage-sections"] });
      setOpen(false);
    },
    onError: () => toast({ title: "Failed to create", variant: "destructive" }),
  });

  const updateSection = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<typeof emptyForm> }) =>
      apiFetch(`/api/homepage-sections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Section updated" });
      qc.invalidateQueries({ queryKey: ["/api/homepage-sections"] });
      setOpen(false);
      setEditing(null);
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const deleteSection = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/homepage-sections/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "Section deleted" });
      qc.invalidateQueries({ queryKey: ["/api/homepage-sections"] });
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const toggleActive = (section: Section) => {
    updateSection.mutate({ id: section.id, data: { isActive: !section.isActive } });
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sortOrder: (sections?.length || 0) * 10 });
    setOpen(true);
  };

  const openEdit = (section: Section) => {
    setEditing(section);
    setForm({
      sectionType: section.sectionType,
      title: section.title || "",
      subtitle: section.subtitle || "",
      content: section.content || "",
      imageUrl: section.imageUrl || "",
      linkUrl: section.linkUrl || "",
      buttonText: section.buttonText || "",
      isActive: section.isActive,
      sortOrder: section.sortOrder,
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      sortOrder: Number(form.sortOrder),
    };
    if (editing) {
      updateSection.mutate({ id: editing.id, data: payload });
    } else {
      createSection.mutate(payload);
    }
  };

  const sorted = [...(sections || [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Homepage Content</h1>
          <p className="text-muted-foreground">Manage all sections displayed on the public website homepage.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Section
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground text-sm">No homepage sections yet.</p>
            <Button className="mt-4" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Add First Section
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((section) => (
            <Card key={section.id} className={section.isActive ? "" : "opacity-60"}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
                  {section.imageUrl && (
                    <img
                      src={section.imageUrl}
                      alt=""
                      className="h-16 w-24 rounded-md object-cover border border-border shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={SECTION_COLORS[section.sectionType]}>
                        {SECTION_LABELS[section.sectionType]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Order: {section.sortOrder}</span>
                    </div>
                    {section.title && <p className="font-semibold truncate">{section.title}</p>}
                    {section.subtitle && <p className="text-sm text-muted-foreground truncate">{section.subtitle}</p>}
                    {section.linkUrl && (
                      <p className="text-xs text-blue-600 truncate mt-0.5">{section.linkUrl}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive(section)}
                      title={section.isActive ? "Deactivate" : "Activate"}
                    >
                      {section.isActive ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(section)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSection.mutate(section.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>{editing ? "Edit Section" : "Add Homepage Section"}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-4">
            <form id="section-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Section Type</Label>
                  <Select
                    value={form.sectionType}
                    onValueChange={(v) => setForm({ ...form, sectionType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SECTION_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Section heading"
                />
              </div>

              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={form.subtitle}
                  onChange={e => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Section subheading or tagline"
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder="Body text or JSON config for the section"
                  rows={3}
                />
              </div>

              <ImageUpload
                label="Section Image"
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
              />

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Link URL</Label>
                  <Input
                    value={form.linkUrl}
                    onChange={e => setForm({ ...form, linkUrl: e.target.value })}
                    placeholder="/shop or https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Button Text</Label>
                  <Input
                    value={form.buttonText}
                    onChange={e => setForm({ ...form, buttonText: e.target.value })}
                    placeholder="Shop Now"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={v => setForm({ ...form, isActive: v })}
                />
                <Label>Active (visible on website)</Label>
              </div>
            </form>
          </div>
          <DrawerFooter>
            <Button type="submit" form="section-form" disabled={createSection.isPending || updateSection.isPending}>
              {editing ? "Save Changes" : "Create Section"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
