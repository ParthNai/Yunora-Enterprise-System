import { useState } from "react";
import { useListReviews, useUpdateReview, getListReviewsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Star, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

export default function Reviews() {
  const [status, setStatus] = useState("all");
  const { data: reviews, isLoading } = useListReviews({ status: status === "all" ? undefined : status });
  const updateReview = useUpdateReview();
  const { toast } = useToast();
  const qc = useQueryClient();

  const updateStatus = (id: number, newStatus: string) => {
    updateReview.mutate({ id, data: { status: newStatus as any } }, {
      onSuccess: () => {
        toast({ title: "Review updated" });
        qc.invalidateQueries({ queryKey: getListReviewsQueryKey() });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground">Moderate customer product reviews.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviews</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : (
            <div className="space-y-3">
              {(reviews || []).map((r: any) => (
                <div key={r.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-sm">{r.customerName}</span>
                      <Stars rating={r.rating} />
                      <Badge variant={r.status === "approved" ? "default" : r.status === "featured" ? "default" : r.status === "pending" ? "secondary" : "destructive"} className="capitalize text-xs">
                        {r.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{r.productName}</p>
                    <p className="text-sm">{r.comment}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {r.status === "pending" && (
                      <>
                        <Button variant="outline" size="sm" className="text-green-700 border-green-300" onClick={() => updateStatus(r.id, "approved")}>
                          <Check className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-700 border-red-300" onClick={() => updateStatus(r.id, "rejected")}>
                          <X className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {r.status === "approved" && (
                      <Button variant="outline" size="sm" onClick={() => updateStatus(r.id, "featured")}>
                        <Star className="h-3.5 w-3.5 mr-1" /> Feature
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {!reviews?.length && (
                <div className="h-24 flex items-center justify-center text-muted-foreground">No reviews found.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
