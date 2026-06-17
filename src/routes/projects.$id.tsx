import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Circle, Clock, Paperclip, Send, FileText as FileIcon, Image as ImageIcon, Archive, Download, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/portal/DashboardLayout";
import { Avatar, Card, StatusBadge } from "@/components/portal/Bits";
import { projectById, clientById, milestones, messages, files, invoices, fmtMoney } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$id")({
  head: () => ({ meta: [{ title: "Project — Tela" }] }),
  component: ProjectDetail,
  notFoundComponent: () => (
    <DashboardLayout title="Not found"><p className="text-sm text-muted-foreground">Project not found.</p></DashboardLayout>
  ),
});

const TABS = ["overview", "feed", "files", "invoices"] as const;

function ProjectDetail() {
  const { id } = Route.useParams();
  const p = projectById(id);
  if (!p) throw notFound();
  const c = clientById(p.clientId);
  const ms = milestones.filter((m) => m.projectId === id);
  const msgs = messages.filter((m) => m.projectId === id);
  const invs = invoices.filter((i) => i.projectId === id);
  const [tab, setTab] = useState<(typeof TABS)[number]>("overview");

  return (
    <DashboardLayout title={p.name}>
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      <Card className="mt-4 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold">{p.name}</h2>
              <StatusBadge status={p.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{c?.company} • {c?.name}</p>
          </div>
          <div className="flex flex-wrap gap-6">
            <div><p className="text-xs text-muted-foreground">Deadline</p><p className="text-sm font-semibold">{p.deadline}</p></div>
            <div><p className="text-xs text-muted-foreground">Budget</p><p className="text-sm font-semibold">{fmtMoney(p.budget)}</p></div>
            <div><p className="text-xs text-muted-foreground">Progress</p><p className="text-sm font-semibold">{p.progress}%</p></div>
          </div>
        </div>
      </Card>

      <div className="mt-6 flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("relative px-4 py-2.5 text-sm font-medium capitalize transition", tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t}
            {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && (
          <Card className="p-6">
            <h3 className="font-semibold">Milestone Timeline</h3>
            <ol className="mt-6 space-y-6">
              {ms.map((m, i) => {
                const done = m.status === "approved" || m.status === "completed";
                const active = m.status === "in_progress" || m.status === "under_review";
                return (
                  <li key={m.id} className="relative flex gap-4 pl-10">
                    {i < ms.length - 1 && <span className="absolute left-[15px] top-8 h-full w-px bg-border" />}
                    <span className={cn(
                      "absolute left-0 top-1 grid h-8 w-8 place-items-center rounded-full border-2",
                      done ? "border-success bg-success text-success-foreground" : active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground",
                    )}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : active ? <Clock className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    </span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{m.name}</p>
                        <StatusBadge status={m.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">Due {m.due} • {fmtMoney(m.amount)}</p>
                      {active && (
                        <button onClick={() => toast.success("Milestone marked complete")} className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
                          Mark Complete
                        </button>
                      )}
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
                const mine = m.role === "freelancer";
                return (
                  <div key={m.id} className={cn("flex gap-3", mine && "flex-row-reverse")}>
                    <Avatar name={m.author} />
                    <div className={cn("max-w-md", mine && "text-right")}>
                      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{m.author}</span><span>{m.when}</span>
                      </div>
                      <div className={cn("rounded-2xl px-4 py-2.5 text-sm", mine ? "bg-primary text-primary-foreground" : "bg-muted")}>
                        {m.text}
                      </div>
                      {m.attachments && (
                        <div className={cn("mt-2 flex flex-wrap gap-1.5", mine && "justify-end")}>
                          {m.attachments.map((a) => (
                            <span key={a} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs hover:bg-muted">
                              <Paperclip className="h-3 w-3" /> {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2">
                <button className="text-muted-foreground hover:text-foreground" title="Attach file"><Paperclip className="h-4 w-4" /></button>
                <input placeholder="Type a message…" className="flex-1 bg-transparent text-sm outline-none" />
                <button onClick={() => toast.success("Message sent")} className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground hover:opacity-90"><Send className="h-4 w-4" /></button>
              </div>
            </div>
          </Card>
        )}

        {tab === "files" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {files.map((f) => {
              const Icon = f.type === "pdf" ? FileIcon : f.type === "zip" ? Archive : ImageIcon;
              return (
                <Card key={f.id} className="flex flex-col gap-3 p-4">
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.uploaded} • {f.by}</p>
                  </div>
                  <button className="flex items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs font-medium hover:bg-muted"><Download className="h-3.5 w-3.5" /> Download</button>
                </Card>
              );
            })}
          </div>
        )}

        {tab === "invoices" && (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 text-left font-medium">Invoice</th>
                  <th className="px-5 py-2.5 text-left font-medium">Amount</th>
                  <th className="px-5 py-2.5 text-left font-medium">Due</th>
                  <th className="px-5 py-2.5 text-left font-medium">Status</th>
                  <th className="px-5 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invs.map((i) => (
                  <tr key={i.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-3 font-medium">{i.id}</td>
                    <td className="px-5 py-3">{fmtMoney(i.amount)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{i.due}</td>
                    <td className="px-5 py-3"><StatusBadge status={i.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button title="View" className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-muted"><Eye className="h-3.5 w-3.5" /></button>
                        <button title="Send" className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-muted"><Send className="h-3.5 w-3.5" /></button>
                        <button title="Download" className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-muted"><Download className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}