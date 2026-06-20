import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, FileText as FileIcon, Mail, Phone, Calendar, Image, Archive, Download } from "lucide-react";
import { useState } from "react";
import { DashboardLayout } from "@/components/portal/DashboardLayout";
import { Avatar, Card, StatusBadge } from "@/components/portal/Bits";
import { clientById, projects, invoices, files, fmtMoney } from "@/lib/data";
import { cn } from "@/lib/utils";
import { freelancerAppBeforeLoad } from "@/lib/route-guards";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export const Route = createFileRoute("/clients/$id")({
  beforeLoad: freelancerAppBeforeLoad,
  head: () => ({ meta: [{ title: "Client — Tela" }] }),
  component: ClientDetail,
  notFoundComponent: () => (
    <DashboardLayout title="Not found">
      <p className="text-sm text-muted-foreground">Client not found.</p>
    </DashboardLayout>
  ),
});

const TABS = ["projects", "invoices", "files"] as const;

function ClientDetail() {
  const { user, isAuthenticated } = useRequireAuth('freelancer');
  const { id } = Route.useParams();
  
  if (!isAuthenticated) {
    return <DashboardLayout title="Loading..."><div>Loading...</div></DashboardLayout>;
  }
  
  const c = clientById(id);
  if (!c) throw notFound();
  const [tab, setTab] = useState<(typeof TABS)[number]>("projects");
  const cProjects = projects.filter((p) => p.clientId === id);
  const cInvoices = invoices.filter((i) => i.clientId === id);

  return (
    <DashboardLayout title="Client">
      <Link to="/clients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to clients
      </Link>

      <Card className="mt-4 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={c.name} className="h-20 w-20 text-2xl" />
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold">{c.name}</h2>
            <p className="text-muted-foreground">{c.company}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {c.email}</span>
              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {c.phone}</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Joined {c.joined}</span>
            </div>
          </div>
          <button className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Edit profile</button>
        </div>
      </Card>

      <div className="mt-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium capitalize transition",
              tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
            {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "projects" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cProjects.map((p) => (
              <Card key={p.id} className="p-5">
                <div className="flex items-start justify-between">
                  <p className="font-semibold">{p.name}</p>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Due {p.deadline}</p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${p.progress}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{p.progress}% complete</span>
                  <Link to="/projects/$id" params={{ id: p.id }} className="font-medium text-primary hover:underline">Open →</Link>
                </div>
              </Card>
            ))}
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
                </tr>
              </thead>
              <tbody>
                {cInvoices.map((i) => (
                  <tr key={i.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-3 font-medium">{i.id}</td>
                    <td className="px-5 py-3">{fmtMoney(i.amount)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{i.due}</td>
                    <td className="px-5 py-3"><StatusBadge status={i.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {tab === "files" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {files.map((f) => {
              const Icon = f.type === "pdf" ? FileIcon : f.type === "zip" ? Archive : Image;
              return (
                <Card key={f.id} className="flex flex-col gap-3 p-4">
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.size} • {f.uploaded}</p>
                  </div>
                  <button className="flex items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs font-medium hover:bg-muted">
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}