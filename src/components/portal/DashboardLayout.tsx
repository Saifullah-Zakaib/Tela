import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Briefcase,
  FileText,
  LayoutDashboard,
  Moon,
  Search,
  Settings,
  Sun,
  Users,
  X,
  ChevronDown,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Avatar } from "./Bits";
import { useTheme } from "@/lib/theme";
import { notifications as notifData } from "@/lib/data";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: Briefcase },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/proposals", label: "Proposals", icon: ScrollText },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function DashboardLayout({ children, title }: { children: ReactNode; title?: string }) {
  const { theme, toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const unread = notifData.filter((n) => n.unread).length;

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card/50 px-4 py-5 lg:flex">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">Tela</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => {
            const active = pathname === n.to || pathname.startsWith(n.to + "/");
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl border border-border bg-gradient-to-br from-primary/10 to-accent/10 p-4">
          <p className="text-sm font-semibold">Upgrade to Pro</p>
          <p className="mt-1 text-xs text-muted-foreground">Unlimited clients, branded invoices, custom domains.</p>
          <button className="mt-3 w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90">
            Upgrade
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
          </Link>
          <h1 className="hidden text-lg font-semibold md:block">{title}</h1>
          <div className="relative ml-auto hidden max-w-sm flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search clients, projects, invoices…"
              className="h-10 w-full rounded-xl border border-input bg-muted/50 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:bg-background"
            />
          </div>
          <button
            onClick={toggle}
            title="Toggle theme"
            className="ml-auto grid h-10 w-10 place-items-center rounded-xl border border-border bg-card transition hover:bg-muted md:ml-0"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setNotifOpen(true)}
            title="Notifications"
            className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-card transition hover:bg-muted"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unread}
              </span>
            )}
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5 transition hover:bg-muted"
          >
            <Avatar name="Alex Carter" className="h-7 w-7" />
            <span className="hidden text-sm font-medium md:inline">Alex</span>
            <ChevronDown className="hidden h-3 w-3 md:inline" />
          </button>
        </header>

        {menuOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          >
            <div className="absolute right-4 top-16 w-56 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
              <div className="border-b border-border p-3">
                <p className="text-sm font-semibold">Alex Carter</p>
                <p className="text-xs text-muted-foreground">alex@tela.studio</p>
              </div>
              <div className="p-1">
                <Link to="/settings" className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">Settings</Link>
                <Link to="/portal" className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">View client portal</Link>
                <Link to="/login" className="block rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10">Sign out</Link>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border bg-background/95 px-2 py-2 backdrop-blur lg:hidden">
        {NAV.slice(0, 5).map((n) => {
          const active = pathname === n.to || pathname.startsWith(n.to + "/");
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {n.label}
            </Link>
          );
        })}
      </nav>

      {/* Notifications slide-over */}
      {notifOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in"
            onClick={() => setNotifOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-border bg-card shadow-xl animate-in slide-in-from-right">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h3 className="font-semibold">Notifications</h3>
                <button className="mt-0.5 text-xs text-primary hover:underline">Mark all as read</button>
              </div>
              <button
                onClick={() => setNotifOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {notifData.map((n) => (
                <button
                  key={n.id}
                  className="mb-1 flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-muted"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{n.text}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.when} ago</p>
                  </div>
                  {n.unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}