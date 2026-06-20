import { useState } from "react";
import { useListWarranty, useUpdateWarrantyClaim, getListWarrantyQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  under_review: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  resolved: "bg-gray-100 text-gray-800",
};

export default function Warranty() {
  const [status, setStatus] = useState("all");
  const { data: claims, isLoading } = useListWarranty({ status: status === "all" ? undefined : status });
  const updateClaim = useUpdateWarrantyClaim();
  const { toast } = useToast();
  const qc = useQueryClient();

  const updateStatus = (id: number, newStatus: string) => {
    updateClaim.mutate({ id, data: { status: newStatus as any } }, {
      onSuccess: () => {
        toast({ title: "Warranty claim updated" });
        qc.invalidateQueries({ queryKey: getListWarrantyQueryKey() });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Warranty Claims</h1>
        <p className="text-muted-foreground">Review and manage customer warranty requests.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Claims</SelectItem>
              {Object.keys(STATUS_COLORS).map(s => (
                <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(claims || []).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.customerName}</TableCell>
                      <TableCell className="text-sm">{c.productName}</TableCell>
                      <TableCell className="max-w-[250px]">
                        <p className="text-sm text-muted-foreground truncate">{c.issue}</p>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[c.status] || ""}`}>
                          {c.status?.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <Select defaultValue={c.status} onValueChange={v => updateStatus(c.id, v)}>
                          <SelectTrigger className="h-7 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.keys(STATUS_COLORS).map(s => (
                              <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace("_", " ")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!claims?.length && (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No warranty claims.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
