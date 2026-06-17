import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase, FileText, DollarSign, Plus, MessageSquare, FileCheck, FileWarning, Upload, CheckCircle2,
} from "lucide-react";
import { DashboardLayout } from "@/components/portal/DashboardLayout";
import { StatusBadge, Card } from "@/components/portal/Bits";
import { activity, milestones, projectById, clientById, fmtMoney } from "@/lib/data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Tela" }] }),
  component: Dashboard,
});

const STATS = [
  { label: "Total Projects", value: "12", icon: Briefcase, tone: "bg-primary/10 text-primary", sub: "+2 this month" },
  { label: "Active Projects", value: "5", icon: CheckCircle2, tone: "bg-success/10 text-success", sub: "3 due this week" },
  { label: "Pending Invoices", value: "$12,400", icon: FileText, tone: "bg-warning/15 text-warning", sub: "4 invoices outstanding" },
  { label: "Revenue (June)", value: "$24,800", icon: DollarSign, tone: "bg-accent/10 text-accent", sub: "+18% vs May" },
];

const ICON_MAP: Record<string, any> = {
  approved: FileCheck, paid: DollarSign, message: MessageSquare, file: Upload, overdue: FileWarning,
};

function Dashboard() {
  const upcoming = milestones.filter((m) => m.status !== "approved").slice(0, 5);
  return (
    <DashboardLayout title="Dashboard">
      <div className="mb-2">
        <h2 className="text-2xl font-bold tracking-tight">Welcome back, Alex 👋</h2>
        <p className="mt-1 text-sm text-muted-foreground">Here's what's happening across your studio today.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="mt-2 text-3xl font-bold">{s.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
                </div>
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${s.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Recent Activity</h3>
            <button className="text-xs font-medium text-primary hover:underline">See all</button>
          </div>
          <ul className="mt-4 space-y-1">
            {activity.map((a) => {
              const Icon = ICON_MAP[a.type] ?? MessageSquare;
              return (
                <li key={a.id} className="flex items-start gap-3 rounded-xl p-3 transition hover:bg-muted">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{a.text}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.when}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold">Quick Actions</h3>
          <div className="mt-4 flex flex-col gap-2">
            <Link to="/projects" className="flex items-center justify-between rounded-xl border border-border p-3 text-sm font-medium transition hover:border-primary hover:bg-primary/5">
              New Project <Plus className="h-4 w-4 text-primary" />
            </Link>
            <Link to="/clients" className="flex items-center justify-between rounded-xl border border-border p-3 text-sm font-medium transition hover:border-primary hover:bg-primary/5">
              Add Client <Plus className="h-4 w-4 text-primary" />
            </Link>
            <Link to="/invoices/new" className="flex items-center justify-between rounded-xl border border-border p-3 text-sm font-medium transition hover:border-primary hover:bg-primary/5">
              Create Invoice <Plus className="h-4 w-4 text-primary" />
            </Link>
          </div>
          <div className="mt-4 rounded-xl border border-dashed border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">Need help getting set up?</p>
            <button className="mt-2 text-xs font-medium text-primary hover:underline">Book onboarding call →</button>
          </div>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <h3 className="font-semibold">Upcoming Milestones</h3>
          <Link to="/projects" className="text-xs font-medium text-primary hover:underline">All projects →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-y border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Project</th>
                <th className="px-5 py-2.5 text-left font-medium">Milestone</th>
                <th className="px-5 py-2.5 text-left font-medium">Client</th>
                <th className="px-5 py-2.5 text-left font-medium">Amount</th>
                <th className="px-5 py-2.5 text-left font-medium">Due</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((m) => {
                const p = projectById(m.projectId);
                const c = p ? clientById(p.clientId) : undefined;
                return (
                  <tr key={m.id} className="border-b border-border last:border-0 transition hover:bg-muted/30">
                    <td className="px-5 py-3 font-medium">{p?.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{m.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{c?.name}</td>
                    <td className="px-5 py-3">{fmtMoney(m.amount)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{m.due}</td>
                    <td className="px-5 py-3"><StatusBadge status={m.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}