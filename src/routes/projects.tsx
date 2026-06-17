import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Filter } from "lucide-react";
import { DashboardLayout } from "@/components/portal/DashboardLayout";
import { Card, StatusBadge } from "@/components/portal/Bits";
import { projects, clientById, type Status } from "@/lib/data";

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: "Projects — Tela" }] }),
  component: Projects,
});

const COLUMNS: { id: Status; label: string }[] = [
  { id: "planning", label: "Planning" },
  { id: "in_progress", label: "In Progress" },
  { id: "under_review", label: "Under Review" },
  { id: "completed", label: "Completed" },
];

function Projects() {
  return (
    <DashboardLayout title="Projects">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
          <p className="mt-1 text-sm text-muted-foreground">{projects.length} projects across your studio.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="h-10 rounded-xl border border-input bg-card px-3 text-sm outline-none">
            <option>All clients</option>
            <option>Nile Studios</option>
            <option>Northwind Co.</option>
          </select>
          <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
            <Filter className="h-4 w-4" /> Filters
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Create Project
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = projects.filter((p) => p.status === col.id);
          return (
            <div key={col.id} className="rounded-2xl border border-border bg-muted/30 p-3">
              <div className="mb-3 flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{col.label}</span>
                  <span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">{items.length}</span>
                </div>
                <button className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-card"><Plus className="h-4 w-4" /></button>
              </div>
              <div className="space-y-2">
                {items.map((p) => {
                  const c = clientById(p.clientId);
                  return (
                    <Link key={p.id} to="/projects/$id" params={{ id: p.id }} className="block">
                      <Card className="cursor-grab p-4 active:cursor-grabbing">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm leading-snug">{p.name}</p>
                          <StatusBadge status={p.status} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{c?.company}</p>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${p.progress}%` }} />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Due {p.deadline}</span>
                          <span>{p.progress}%</span>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
                {items.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border bg-card/30 p-4 text-center text-xs text-muted-foreground">
                    No projects in this stage.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}