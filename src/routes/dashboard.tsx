import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase, FileText, DollarSign, Plus, MessageSquare, FileCheck, FileWarning, Upload, CheckCircle2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/portal/DashboardLayout";
import { StatusBadge, Card } from "@/components/portal/Bits";
import { projectsApi, notificationsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { fmtMoney } from "@/lib/data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Tela" }] }),
  component: Dashboard,
});

const ICON_MAP: Record<string, any> = {
  milestone_approved: FileCheck, 
  invoice_paid: DollarSign, 
  new_message: MessageSquare, 
  file: Upload, 
  invoice_overdue: FileWarning,
};

function Dashboard() {
  const { user } = useAuth();
  
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll()
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll({ limit: 6 })
  });

  const projects = projectsData?.data || [];
  const notifications = notificationsData?.data || [];
  
  const activeProjects = projects.filter((p: any) => 
    p.status === 'in_progress' || p.status === 'under_review'
  );
  
  const totalBudget = projects.reduce((sum: number, p: any) => sum + (p.budget || 0), 0);

  const STATS = [
    { label: "Total Projects", value: projects.length.toString(), icon: Briefcase, tone: "bg-primary/10 text-primary", sub: `${activeProjects.length} active` },
    { label: "Active Projects", value: activeProjects.length.toString(), icon: CheckCircle2, tone: "bg-success/10 text-success", sub: "In progress" },
    { label: "Notifications", value: notificationsData?.unreadCount?.toString() || "0", icon: MessageSquare, tone: "bg-warning/15 text-warning", sub: "Unread messages" },
    { label: "Total Budget", value: fmtMoney(totalBudget), icon: DollarSign, tone: "bg-accent/10 text-accent", sub: "Across all projects" },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="mb-2">
        <h2 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋</h2>
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
            <Link to="/dashboard" className="text-xs font-medium text-primary hover:underline">See all</Link>
          </div>
          <ul className="mt-4 space-y-1">
            {notifications.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">No recent activity</li>
            ) : (
              notifications.map((n: any) => {
                const Icon = ICON_MAP[n.type] ?? MessageSquare;
                return (
                  <li key={n._id} className="flex items-start gap-3 rounded-xl p-3 transition hover:bg-muted">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{n.message}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </li>
                );
              })
            )}
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
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <h3 className="font-semibold">Recent Projects</h3>
          <Link to="/projects" className="text-xs font-medium text-primary hover:underline">All projects →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-y border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Project</th>
                <th className="px-5 py-2.5 text-left font-medium">Client</th>
                <th className="px-5 py-2.5 text-left font-medium">Budget</th>
                <th className="px-5 py-2.5 text-left font-medium">Deadline</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No projects yet. Create your first project to get started.
                  </td>
                </tr>
              ) : (
                projects.slice(0, 5).map((p: any) => (
                  <tr key={p._id} className="border-b border-border last:border-0 transition hover:bg-muted/30">
                    <td className="px-5 py-3 font-medium">{p.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{p.client?.name}</td>
                    <td className="px-5 py-3">{fmtMoney(p.budget || 0)}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {p.deadline ? new Date(p.deadline).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}