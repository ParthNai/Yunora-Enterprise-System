import { useListActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Package, ShoppingCart, Tag, Users, ShieldCheck, MessageSquare, FileText, Settings, Megaphone } from "lucide-react";

const ENTITY_ICONS: Record<string, any> = {
  Product: Package,
  Order: ShoppingCart,
  Coupon: Tag,
  Customer: Users,
  Dealer: Users,
  Warranty: ShieldCheck,
  Review: MessageSquare,
  Blog: FileText,
  Banner: Megaphone,
  Offer: Tag,
  Campaign: Megaphone,
  Ticket: ShieldCheck,
  Settings: Settings,
};

const ENTITY_COLORS: Record<string, string> = {
  Product: "bg-blue-100 text-blue-700",
  Order: "bg-green-100 text-green-700",
  Coupon: "bg-purple-100 text-purple-700",
  Customer: "bg-orange-100 text-orange-700",
  Dealer: "bg-indigo-100 text-indigo-700",
  Banner: "bg-pink-100 text-pink-700",
  Offer: "bg-yellow-100 text-yellow-700",
  Campaign: "bg-red-100 text-red-700",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString("en-IN");
}

export default function ActivityLog() {
  const { data: logs, isLoading } = useListActivity({ limit: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground">Recent admin actions across the system.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            <div className="space-y-1">
              {(logs || []).map((log: any) => {
                const IconComp = ENTITY_ICONS[log.entity] || Activity;
                const colorClass = ENTITY_COLORS[log.entity] || "bg-gray-100 text-gray-700";
                return (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">{log.action}</p>
                        <span className="text-xs text-muted-foreground shrink-0">{timeAgo(log.createdAt)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>
                      <p className="text-xs text-muted-foreground">by {log.user}</p>
                    </div>
                  </div>
                );
              })}
              {!logs?.length && (
                <div className="h-24 flex items-center justify-center text-muted-foreground">No activity yet.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
