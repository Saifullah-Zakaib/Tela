import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Circle, Clock, CreditCard, Download, FileText, Image as ImageIcon, Archive, Lock, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Avatar, Card, StatusBadge } from "@/components/portal/Bits";
import { projectById, clientById, milestones, messages, files, invoices, fmtMoney } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/projects/$id")({
  head: () => ({ meta: [{ title: "Project — Client Portal" }] }),
  component: PortalProject,
  notFoundComponent: () => (<PortalLayout><p className="text-sm text-muted-foreground">Project not found.</p></PortalLayout>),
});

const TABS = ["overview", "feed", "files", "invoices"] as const;

function PortalProject() {
  const { id } = Route.useParams();
  const p = projectById(id);
  if (!p) throw notFound();
  const c = clientById(p.clientId);
  const ms = milestones.filter((m) => m.projectId === id);
  const msgs = messages.filter((m) => m.projectId === id);
  const invs = invoices.filter((i) => i.projectId === id);
  const [tab, setTab] = useState<(typeof TABS)[number]>("overview");
  const [payOpen, setPayOpen] = useState<string | null>(null);

  return (
    <PortalLayout title={p.name}>
      <Link to="/portal" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All projects
      </Link>
      <Card className="mt-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{p.name}</h1>
          <StatusBadge status={p.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{c?.company} • Due {p.deadline}</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${p.progress}%` }} /></div>
      </Card>

      <div className="mt-6 flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("relative px-4 py-2.5 text-sm font-medium capitalize transition", tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t}{tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && (
          <Card className="p-6">
            <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> You're viewing milestones in read-only mode.
            </div>
            <ol className="mt-6 space-y-6">
              {ms.map((m, i) => {
                const done = m.status === "approved" || m.status === "completed";
                const active = m.status === "in_progress" || m.status === "under_review";
                return (
                  <li key={m.id} className="relative flex gap-4 pl-10">
                    {i < ms.length - 1 && <span className="absolute left-[15px] top-8 h-full w-px bg-border" />}
                    <span className={cn("absolute left-0 top-1 grid h-8 w-8 place-items-center rounded-full border-2", done ? "border-success bg-success text-success-foreground" : active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground")}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : active ? <Clock className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    </span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{m.name}</p><StatusBadge status={m.status} /></div>
                      <p className="mt-0.5 text-xs text-muted-foreground">Due {m.due}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        )}

        {tab === "feed" && (
          <Card className="flex h-[600px] flex-col">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {msgs.map((m) => {
                const mine = m.role === "client";
                return (
                  <div key={m.id} className={cn("flex gap-3", mine && "flex-row-reverse")}>
                    <Avatar name={m.author} />
                    <div className={cn("max-w-md", mine && "text-right")}>
                      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground"><span className="font-medium text-foreground">{m.author}</span><span>{m.when}</span></div>
                      <div className={cn("rounded-2xl px-4 py-2.5 text-sm", mine ? "bg-primary text-primary-foreground" : "bg-muted")}>{m.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2">
                <input placeholder="Reply…" className="flex-1 bg-transparent text-sm outline-none" />
                <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">Send</button>
              </div>
            </div>
          </Card>
        )}

        {tab === "files" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {files.map((f) => {
              const Icon = f.type === "pdf" ? FileText : f.type === "zip" ? Archive : ImageIcon;
              return (
                <Card key={f.id} className="flex flex-col gap-3 p-4">
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div>
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{f.name}</p><p className="text-xs text-muted-foreground">{f.uploaded}</p></div>
                  <button className="flex items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs font-medium hover:bg-muted"><Download className="h-3.5 w-3.5" /> Download</button>
                </Card>
              );
            })}
          </div>
        )}

        {tab === "invoices" && (
          <div className="space-y-3">
            {invs.map((i) => (
              <Card key={i.id} className="flex flex-wrap items-center gap-4 p-5">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{i.id}</p>
                  <p className="text-xs text-muted-foreground">Due {i.due}</p>
                </div>
                <p className="text-lg font-bold">{fmtMoney(i.amount)}</p>
                <StatusBadge status={i.status} />
                {i.status !== "paid" && (
                  <button onClick={() => setPayOpen(i.id)} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                    <CreditCard className="h-4 w-4" /> Pay Now
                  </button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {payOpen && <PayModal id={payOpen} onClose={() => setPayOpen(null)} />}
    </PortalLayout>
  );
}

function PayModal({ id, onClose }: { id: string; onClose: () => void }) {
  const inv = invoices.find((i) => i.id === id)!;
  function submit(e: React.FormEvent) {
    e.preventDefault();
    toast.success(`Payment of ${fmtMoney(inv.amount)} processed`);
    onClose();
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-card shadow-2xl animate-in zoom-in-95 fade-in">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div><h3 className="font-semibold">Pay invoice {inv.id}</h3><p className="text-xs text-muted-foreground">{fmtMoney(inv.amount)} due to Tela Studio</p></div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-5">
          <Lbl label="Card number"><input required placeholder="1234 5678 9012 3456" className={inp} /></Lbl>
          <div className="grid grid-cols-2 gap-3">
            <Lbl label="Expiry"><input required placeholder="MM / YY" className={inp} /></Lbl>
            <Lbl label="CVC"><input required placeholder="123" className={inp} /></Lbl>
          </div>
          <Lbl label="Name on card"><input required placeholder="Ahmed Hassan" className={inp} /></Lbl>
          <button type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Lock className="h-4 w-4" /> Pay {fmtMoney(inv.amount)}
          </button>
          <p className="text-center text-xs text-muted-foreground">Payments are processed securely. Your card details never touch our servers.</p>
        </form>
      </div>
    </div>
  );
}

const inp = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary";
function Lbl({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>{children}</label>;
}