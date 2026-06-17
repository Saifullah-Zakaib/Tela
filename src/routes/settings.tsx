import { createFileRoute } from "@tanstack/react-router";
import { Camera, LogOut, Monitor, Smartphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/portal/DashboardLayout";
import { Avatar, Card } from "@/components/portal/Bits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Tela" }] }),
  component: Settings,
});

const TABS = ["profile", "branding", "notifications", "security"] as const;

function Settings() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("profile");
  return (
    <DashboardLayout title="Settings">
      <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
      <p className="mt-1 text-sm text-muted-foreground">Manage your studio preferences and branding.</p>

      <div className="mt-6 flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("relative px-4 py-2.5 text-sm font-medium capitalize transition", tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t}
            {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "profile" && <Profile />}
        {tab === "branding" && <Branding />}
        {tab === "notifications" && <Notifications />}
        {tab === "security" && <Security />}
      </div>
    </DashboardLayout>
  );
}

const inp = "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary";
function Lbl({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium">{label}</span>{children}</label>;
}

function Profile() {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative">
          <Avatar name="Alex Carter" className="h-20 w-20 text-2xl" />
          <button className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border border-border bg-card hover:bg-muted"><Camera className="h-3.5 w-3.5" /></button>
        </div>
        <div><p className="font-semibold">Alex Carter</p><p className="text-sm text-muted-foreground">Brand designer • Tela Studio</p></div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Lbl label="Full name"><input defaultValue="Alex Carter" className={inp} /></Lbl>
        <Lbl label="Email"><input defaultValue="alex@tela.studio" className={inp} /></Lbl>
        <Lbl label="Phone"><input defaultValue="+1 415 555 0102" className={inp} /></Lbl>
        <Lbl label="Location"><input defaultValue="San Francisco, CA" className={inp} /></Lbl>
        <div className="sm:col-span-2"><Lbl label="Bio"><textarea rows={3} defaultValue="Brand designer working with founders to build identities that mean something." className={inp + " resize-none py-2"} /></Lbl></div>
      </div>
      <div className="mt-6 flex justify-end">
        <button onClick={() => toast.success("Profile saved")} className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Save changes</button>
      </div>
    </Card>
  );
}

function Branding() {
  const [color, setColor] = useState("#4F46E5");
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <h3 className="font-semibold">Brand identity</h3>
        <div className="mt-5 space-y-4">
          <div>
            <span className="mb-1.5 block text-sm font-medium">Logo</span>
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground font-bold">T</div>
              <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Upload logo</button>
            </div>
          </div>
          <Lbl label="Business name"><input defaultValue="Tela Studio" className={inp} /></Lbl>
          <Lbl label="Tagline"><input defaultValue="Identities that mean something" className={inp} /></Lbl>
          <Lbl label="Primary color">
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 w-14 cursor-pointer rounded-xl border border-input bg-transparent" />
              <input value={color} onChange={(e) => setColor(e.target.value)} className={inp} />
            </div>
          </Lbl>
        </div>
        <button onClick={() => toast.success("Branding saved")} className="mt-6 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Save branding</button>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-5"><h3 className="font-semibold">Client portal preview</h3><p className="text-xs text-muted-foreground">How your branding appears to clients.</p></div>
        <div className="border-t border-border" style={{ background: color + "08" }}>
          <div className="p-6">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl text-white font-bold" style={{ background: color }}>T</div>
              <span className="font-bold">Tela Studio</span>
            </div>
            <p className="mt-5 text-xs uppercase tracking-wide text-muted-foreground">Welcome back, Ahmed</p>
            <p className="mt-2 text-xl font-semibold">Your active project</p>
            <div className="mt-4 rounded-xl border border-border bg-card p-4">
              <p className="font-medium">Brand Identity Refresh</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ background: color, width: "60%" }} /></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Notifications() {
  const opts = [
    { l: "Invoice paid", d: "When a client successfully pays an invoice." },
    { l: "Milestone approved", d: "When a client approves a completed milestone." },
    { l: "New message", d: "When a client sends a message on any project." },
    { l: "Proposal accepted", d: "When a client accepts a proposal." },
    { l: "Weekly digest", d: "A summary of activity every Monday morning." },
  ];
  const [on, setOn] = useState<Record<string, boolean>>({ 0: true, 1: true, 2: true, 3: true, 4: false });
  return (
    <Card className="p-6">
      <h3 className="font-semibold">Notification preferences</h3>
      <div className="mt-4 divide-y divide-border">
        {opts.map((o, i) => (
          <div key={o.l} className="flex items-start justify-between gap-4 py-4">
            <div><p className="text-sm font-medium">{o.l}</p><p className="text-xs text-muted-foreground">{o.d}</p></div>
            <button onClick={() => setOn({ ...on, [i]: !on[i] })} className={cn("relative h-6 w-11 rounded-full transition", on[i] ? "bg-primary" : "bg-muted")}>
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on[i] ? "left-5" : "left-0.5")} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Security() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <h3 className="font-semibold">Change password</h3>
        <div className="mt-5 space-y-4">
          <Lbl label="Current password"><input type="password" className={inp} /></Lbl>
          <Lbl label="New password"><input type="password" className={inp} /></Lbl>
          <Lbl label="Confirm new password"><input type="password" className={inp} /></Lbl>
        </div>
        <button onClick={() => toast.success("Password updated")} className="mt-6 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Update password</button>
      </Card>
      <Card className="p-6">
        <h3 className="font-semibold">Active sessions</h3>
        <div className="mt-4 divide-y divide-border">
          {[
            { d: "MacBook Pro — Chrome", w: "San Francisco, CA · Active now", i: Monitor },
            { d: "iPhone 15 — Safari", w: "San Francisco, CA · 2 hours ago", i: Smartphone },
          ].map((s) => (
            <div key={s.d} className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted"><s.i className="h-4 w-4" /></div>
                <div><p className="text-sm font-medium">{s.d}</p><p className="text-xs text-muted-foreground">{s.w}</p></div>
              </div>
              <button onClick={() => toast.success("Session ended")} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive">
                <LogOut className="h-3 w-3" /> Log out
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}