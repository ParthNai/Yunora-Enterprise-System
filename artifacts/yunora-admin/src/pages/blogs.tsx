import { useState } from "react";
import { useListBlogs, useCreateBlog, useUpdateBlog, useDeleteBlog, getListBlogsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Blogs() {
  const { data: blogs, isLoading } = useListBlogs();
  const createBlog = useCreateBlog();
  const updateBlog = useUpdateBlog();
  const deleteBlog = useDeleteBlog();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", category: "", tags: "", status: "draft" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createBlog.mutate({ data: form as any }, {
      onSuccess: () => {
        toast({ title: "Blog post created" });
        qc.invalidateQueries({ queryKey: getListBlogsQueryKey() });
        setOpen(false);
        setForm({ title: "", slug: "", excerpt: "", category: "", tags: "", status: "draft" });
      },
    });
  };

  const togglePublish = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    updateBlog.mutate({ id, data: { status: newStatus as any } as any }, {
      onSuccess: () => {
        toast({ title: newStatus === "published" ? "Post published" : "Post moved to draft" });
        qc.invalidateQueries({ queryKey: getListBlogsQueryKey() });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
          <p className="text-muted-foreground">Manage blog posts and content.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> New Post</Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(blogs || []).map((b: any) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{b.title}</p>
                            <p className="text-xs text-muted-foreground font-mono">{b.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{b.category || "—"}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{b.tags || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={b.status === "published" ? "default" : "secondary"} className="capitalize">{b.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(b.createdAt).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="outline" size="sm" className="text-xs" onClick={() => togglePublish(b.id, b.status)}>
                            {b.status === "published" ? "Unpublish" : "Publish"}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteBlog.mutate({ id: b.id }, { onSuccess: () => { toast({ title: "Deleted" }); qc.invalidateQueries({ queryKey: getListBlogsQueryKey() }); } })}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!blogs?.length && (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No blog posts yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Drawer open={open} onOpenChange={setOpen} direction="right">
        <DrawerContent className="w-full sm:w-[500px] h-full rounded-l-xl">
          <DrawerHeader><DrawerTitle>New Blog Post</DrawerTitle></DrawerHeader>
          <form onSubmit={handleCreate} className="p-4 space-y-4 overflow-y-auto">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g,"") })} required /></div>
            <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Excerpt</Label><Input value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} /></div>
            <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Interior Design, Buying Guide..." /></div>
            <div className="space-y-2"><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="sofa,living room,design" /></div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DrawerFooter className="px-0">
              <Button type="submit" disabled={createBlog.isPending}>{createBlog.isPending ? "Creating..." : "Create Post"}</Button>
              <DrawerClose asChild><Button variant="outline">Cancel</Button></DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
