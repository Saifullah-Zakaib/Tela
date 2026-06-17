import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Copy, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/portal/DashboardLayout";
import { Card } from "@/components/portal/Bits";
import { clients, fmtMoney } from "@/lib/data";

export const Route = createFileRoute("/proposals/new")({
  head: () => ({ meta: [{ title: "New Proposal — Tela" }] }),
  component: NewProposal,
});

function NewProposal() {
  const [f, setF] = useState({
    title: "Brand Identity Refresh",
    clientId: clients[0]?.id ?? "",
    desc: "A complete brand refresh including discovery, logo concepts, type system, and a 40-page brand guidelines document.",
    timeline: "6 weeks",
    total: 6800,
    terms: "50% upfront, 50% on delivery. Two revision rounds included per milestone.",
  });
  const [deliverables, setDeliverables] = useState(["Discovery workshop", "3 logo directions", "Final brand system", "40-page guidelines PDF"]);
  const client = clients.find((c) => c.id === f.clientId);

  return (
    <DashboardLayout title="New Proposal">
      <Link to="/proposals" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to proposals
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold">Proposal Details</h3>
          <div className="mt-5 space-y-4">
            <Lbl label="Project title"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={inp} /></Lbl>
            <Lbl label="Client">
              <select value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })} className={inp}>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
              </select>
            </Lbl>
            <Lbl label="Project description"><textarea rows={4} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} className={inp + " resize-none py-2"} /></Lbl>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Deliverables</span>
              <div className="space-y-2">
                {deliverables.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={d} onChange={(e) => setDeliverables(deliverables.map((x, j) => j === i ? e.target.value : x))} className={inp} />
                    <button onClick={() => setDeliverables(deliverables.filter((_, j) => j !== i))} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                <button onClick={() => setDeliverables([...deliverables, ""])} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"><Plus className="h-4 w-4" /> Add deliverable</button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Lbl label="Timeline"><input value={f.timeline} onChange={(e) => setF({ ...f, timeline: e.target.value })} className={inp} /></Lbl>
              <Lbl label="Total price (USD)"><input type="number" value={f.total} onChange={(e) => setF({ ...f, total: +e.target.value })} className={inp} /></Lbl>
            </div>
            <Lbl label="Payment terms"><textarea rows={3} value={f.terms} onChange={(e) => setF({ ...f, terms: e.target.value })} className={inp + " resize-none py-2"} /></Lbl>
          </div>
          <button onClick={() => toast.success("Proposal generated")} className="mt-6 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">Generate Proposal</button>
        </Card>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-primary to-accent p-8 text-primary-foreground">
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur"><Sparkles className="h-5 w-5" /></div>
                <span className="font-bold">Tela Studio</span>
              </div>
              <h2 className="mt-6 text-3xl font-bold">{f.title}</h2>
              <p className="mt-1 text-primary-foreground/80">Prepared for {client?.name} • {client?.company}</p>
            </div>
            <div className="space-y-6 p-8 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overview</p>
                <p className="mt-2 leading-relaxed">{f.desc}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deliverables</p>
                <ul className="mt-2 space-y-1.5">
                  {deliverables.map((d, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" /> {d}</li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-muted/30 p-4">
                <div><p className="text-xs text-muted-foreground">Timeline</p><p className="font-semibold">{f.timeline}</p></div>
                <div className="text-right"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{fmtMoney(f.total)}</p></div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment Terms</p>
                <p className="mt-2 text-muted-foreground">{f.terms}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <button className="rounded-xl bg-success px-4 py-3 text-sm font-semibold text-success-foreground hover:opacity-90">Accept Proposal</button>
                <button className="rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted">Request Changes</button>
              </div>
              <div className="flex gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-3">
                <input readOnly value="https://tela.app/p/abc-xyz-123" className="flex-1 bg-transparent text-xs outline-none" />
                <button onClick={() => { navigator.clipboard?.writeText("https://tela.app/p/abc-xyz-123"); toast.success("Link copied"); }} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"><Copy className="h-3 w-3" /> Copy</button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

const inp = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary";
function Lbl({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>{children}</label>;
}