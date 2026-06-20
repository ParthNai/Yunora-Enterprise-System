import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Building2, Boxes,
  Image as ImageIcon, Tag, TicketPercent, CalendarDays, Target,
  ShieldCheck, MessageSquare, FileText, LifeBuoy, Activity,
  Settings, LogOut, Menu, Home, FolderOpen, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

type NavItem = { href: string; label: string; icon: React.ElementType };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { href: "/products",   label: "Products",   icon: Package },
      { href: "/categories", label: "Categories", icon: FolderOpen },
      { href: "/inventory",  label: "Inventory",  icon: Boxes },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/orders",    label: "Orders",    icon: ShoppingCart },
      { href: "/customers", label: "Customers", icon: Users },
      { href: "/dealers",   label: "Dealers",   icon: Building2 },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/homepage",  label: "Homepage",  icon: Home },
      { href: "/banners",   label: "Banners",   icon: ImageIcon },
      { href: "/offers",    label: "Offers",    icon: Tag },
      { href: "/coupons",   label: "Coupons",   icon: TicketPercent },
      { href: "/campaigns", label: "Campaigns", icon: CalendarDays },
      { href: "/leads",     label: "Leads",     icon: Target },
    ],
  },
  {
    label: "Support",
    items: [
      { href: "/warranty", label: "Warranty", icon: ShieldCheck },
      { href: "/reviews",  label: "Reviews",  icon: MessageSquare },
      { href: "/blogs",    label: "Blogs",    icon: FileText },
      { href: "/tickets",  label: "Tickets",  icon: LifeBuoy },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/activity", label: "Activity Log", icon: Activity },
      { href: "/settings", label: "Settings",     icon: Settings },
    ],
  },
];

const formatRole = (role?: string) =>
  role ? role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Admin";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  // pinned = user clicked to lock sidebar open; hovered = mouse is inside
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { user, logout } = useAuth();
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const expanded = pinned || hovered;

  const onMouseEnter = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHovered(true);
  };
  const onMouseLeave = () => {
    hoverTimer.current = setTimeout(() => setHovered(false), 120);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border",
          "transition-[width] duration-200 ease-in-out",
          "lg:static lg:translate-x-0",
          // mobile
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // width: collapsed = icon-only, expanded = full labels
          expanded ? "w-[200px]" : "w-[46px]"
        )}
      >
        {/* Logo / toggle */}
        <div className="flex h-11 shrink-0 items-center border-b border-sidebar-border overflow-hidden">
          <button
            onClick={() => setPinned(p => !p)}
            className="flex h-11 w-[46px] shrink-0 items-center justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground/90 transition-colors"
            title={pinned ? "Collapse sidebar" : "Pin sidebar open"}
          >
            {expanded
              ? <ChevronRight className="h-3.5 w-3.5 rotate-180 transition-transform duration-200" />
              : <Menu className="h-3.5 w-3.5" />
            }
          </button>
          {/* Logo — only visible when expanded */}
          <div className={cn(
            "flex items-center gap-1.5 overflow-hidden transition-all duration-200",
            expanded ? "opacity-100 w-auto" : "opacity-0 w-0"
          )}>
            <img
              src="/yunora-logo.png" alt="Yunora"
              className="h-5 w-auto object-contain shrink-0"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className="text-[13px] font-bold text-sidebar-foreground/90 whitespace-nowrap">Admin</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1 space-y-0">
          {navGroups.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? "mt-0.5" : ""}>
              {/* Section label — slides in when expanded */}
              <div className={cn(
                "overflow-hidden transition-all duration-200",
                expanded ? "max-h-6 opacity-100" : "max-h-0 opacity-0"
              )}>
                <p className="px-3 pt-2 pb-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/30 select-none whitespace-nowrap">
                  {group.label}
                </p>
              </div>

              {group.items.map((item) => {
                const isActive = item.href === "/dashboard"
                  ? location === "/dashboard"
                  : location.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={!expanded ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded transition-colors leading-none h-[27px] overflow-hidden",
                      expanded ? "mx-1.5 px-2.5" : "mx-1 px-0 justify-center",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="h-[14px] w-[14px] shrink-0" />
                    <span className={cn(
                      "text-[12.5px] font-medium whitespace-nowrap transition-all duration-200 overflow-hidden",
                      expanded ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"
                    )}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="shrink-0 border-t border-sidebar-border overflow-hidden">
          <div className={cn(
            "flex items-center gap-2 px-2 py-2 transition-all duration-200",
            !expanded && "justify-center"
          )}>
            {/* Avatar — always visible */}
            <div className="h-6 w-6 rounded-full bg-sidebar-primary flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() ?? "A"}
              </span>
            </div>

            {/* Name + role — slide in when expanded */}
            <div className={cn(
              "flex-1 min-w-0 leading-tight overflow-hidden transition-all duration-200",
              expanded ? "max-w-[120px] opacity-100" : "max-w-0 opacity-0"
            )}>
              <p className="text-[11px] font-semibold text-sidebar-foreground/90 truncate">{user?.name ?? "Admin"}</p>
              <p className="text-[9px] text-sidebar-foreground/40 truncate">{formatRole(user?.role)}</p>
            </div>

            {/* Logout — always visible when expanded */}
            {expanded && (
              <button
                onClick={() => logout.mutate()}
                title="Sign out"
                className="text-sidebar-foreground/35 hover:text-sidebar-foreground/80 transition-colors rounded p-0.5 shrink-0"
              >
                <LogOut className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="flex h-11 shrink-0 items-center justify-between border-b bg-card px-4">
          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <Button variant="ghost" size="icon" className="h-7 w-7 lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            {/* Breadcrumb */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground/80">Yunora</span>
              <span className="text-muted-foreground/50">/</span>
              <span className="capitalize font-medium text-foreground">
                {location.split("/")[1] || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary">{user?.name?.charAt(0).toUpperCase() ?? "A"}</span>
              </div>
              <div className="leading-tight">
                <p className="text-[11px] font-semibold">{user?.name ?? "Admin"}</p>
                <p className="text-[10px] text-muted-foreground">{formatRole(user?.role)}</p>
              </div>
            </div>
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => logout.mutate()}
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
