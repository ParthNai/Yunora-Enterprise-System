import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";

import { AppLayout } from "@/components/layout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import Categories from "@/pages/categories";
import Orders from "@/pages/orders";
import Customers from "@/pages/customers";
import Dealers from "@/pages/dealers";
import Inventory from "@/pages/inventory";
import Banners from "@/pages/banners";
import Offers from "@/pages/offers";
import Coupons from "@/pages/coupons";
import Campaigns from "@/pages/campaigns";
import Leads from "@/pages/leads";
import Warranty from "@/pages/warranty";
import Reviews from "@/pages/reviews";
import Blogs from "@/pages/blogs";
import Tickets from "@/pages/tickets";
import ActivityLog from "@/pages/activity";
import Settings from "@/pages/settings";
import Homepage from "@/pages/homepage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 3 * 60 * 1000,   // 3 min — data served from cache instantly
      gcTime: 10 * 60 * 1000,     // 10 min — keep in memory
    },
    mutations: {
      retry: 0,
    },
  },
});

import { apiFetch } from "@/lib/api";

type AdminUser = { id: number; name: string; email: string; role: string };

async function fetchMe(): Promise<AdminUser | null> {
  const res = await apiFetch("/api/auth/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) return null;
  return res.json();
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useQuery<AdminUser | null>({
    queryKey: ["auth-me"],
    queryFn: fetchMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Redirect to="/" />;
  return <AppLayout>{children}</AppLayout>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useQuery<AdminUser | null>({
    queryKey: ["auth-me"],
    queryFn: fetchMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Redirect to="/dashboard" />;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/"><PublicOnlyRoute><Login /></PublicOnlyRoute></Route>
      <Route path="/dashboard"><ProtectedRoute><Dashboard /></ProtectedRoute></Route>
      <Route path="/products"><ProtectedRoute><Products /></ProtectedRoute></Route>
      <Route path="/products/:id"><ProtectedRoute><ProductDetail /></ProtectedRoute></Route>
      <Route path="/categories"><ProtectedRoute><Categories /></ProtectedRoute></Route>
      <Route path="/orders"><ProtectedRoute><Orders /></ProtectedRoute></Route>
      <Route path="/customers"><ProtectedRoute><Customers /></ProtectedRoute></Route>
      <Route path="/dealers"><ProtectedRoute><Dealers /></ProtectedRoute></Route>
      <Route path="/inventory"><ProtectedRoute><Inventory /></ProtectedRoute></Route>
      <Route path="/banners"><ProtectedRoute><Banners /></ProtectedRoute></Route>
      <Route path="/offers"><ProtectedRoute><Offers /></ProtectedRoute></Route>
      <Route path="/coupons"><ProtectedRoute><Coupons /></ProtectedRoute></Route>
      <Route path="/campaigns"><ProtectedRoute><Campaigns /></ProtectedRoute></Route>
      <Route path="/leads"><ProtectedRoute><Leads /></ProtectedRoute></Route>
      <Route path="/warranty"><ProtectedRoute><Warranty /></ProtectedRoute></Route>
      <Route path="/reviews"><ProtectedRoute><Reviews /></ProtectedRoute></Route>
      <Route path="/blogs"><ProtectedRoute><Blogs /></ProtectedRoute></Route>
      <Route path="/tickets"><ProtectedRoute><Tickets /></ProtectedRoute></Route>
      <Route path="/activity"><ProtectedRoute><ActivityLog /></ProtectedRoute></Route>
      <Route path="/settings"><ProtectedRoute><Settings /></ProtectedRoute></Route>
      <Route path="/homepage"><ProtectedRoute><Homepage /></ProtectedRoute></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
