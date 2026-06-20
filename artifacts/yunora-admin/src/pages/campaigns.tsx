import { useState } from "react";
import { useListCampaigns, useCreateCampaign, useUpdateCampaign, getListCampaignsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Plus, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const campaignColors: Record<string, string> = {
  diwali: "bg-orange-100 text-orange-800 border-orange-200",
  navratri: "bg-red-100 text-red-800 border-red-200",
  christmas: "bg-green-100 text-green-800 border-green-200",
  republic_day: "bg-blue-100 text-blue-800 border-blue-200",
  independence_day: "bg-indigo-100 text-indigo-800 border-indigo-200",
  holi: "bg-pink-100 text-pink-800 border-pink-200",
};

export default function Campaigns() {
  const { data: campaigns, isLoading } = useListCampaigns();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "", description: "", isActive: false });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createCampaign.mutate({ data: form as any }, {
      onSuccess: () => {
        toast({ title: "Campaign created" });
        qc.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
        setOpen(false);
        setForm({ name: "", type: "", description: "", isActive: false });
      },
    });
  };

  const toggleActive = (id: number, isActive: boolean) => {
    updateCampaign.mutate({ id, data: { isActive } as any }, {
      onSuccess: () => {
        toast({ title: isActive ? "Campaign activated" : "Campaign deactivated" });
        qc.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">Manage seasonal and promotional campaigns.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> New Campaign</Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {(campaigns || []).map((c: any) => (
            <Card key={c.id} className={`border-2 ${c.isActive ? "border-primary/50 shadow-md" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${campaignColors[c.type] || "bg-gray-100 text-gray-800"}`}>
                      {c.type?.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.isActive ? "default" : "outline"}>{c.isActive ? "Active" : "Inactive"}</Badge>
                    <Switch checked={c.isActive} onCheckedChange={v => toggleActive(c.id, v)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{c.description}</p>
                {c.startsAt && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {new Date(c.startsAt).toLocaleDateString("en-IN")}
                    {c.endsAt && <> — {new Date(c.endsAt).toLocaleDateString("en-IN")}</>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && !campaigns?.length && (
        <Card><CardContent className="h-32 flex items-center justify-center text-muted-foreground">No campaigns yet.</CardContent></Card>
      )}

      <Drawer open={open} onOpenChange={setOpen} direction="right">
        <DrawerContent className="w-full sm:w-[480px] h-full rounded-l-xl">
          <DrawerHeader><DrawerTitle>New Campaign</DrawerTitle></DrawerHeader>
          <form onSubmit={handleCreate} className="p-4 space-y-4 overflow-y-auto">
            <div className="space-y-2"><Label>Campaign Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Type</Label><Input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} placeholder="diwali, christmas, holi..." required /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} /><Label>Activate immediately</Label></div>
            <DrawerFooter className="px-0">
              <Button type="submit" disabled={createCampaign.isPending}>{createCampaign.isPending ? "Creating..." : "Create Campaign"}</Button>
              <DrawerClose asChild><Button variant="outline">Cancel</Button></DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
