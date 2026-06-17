import { createFileRoute, Link } from "@tanstack/react-router";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, StatusBadge } from "@/components/portal/Bits";
import { projects } from "@/lib/data";

export const Route = createFileRoute("/portal")({
  head: () => ({ meta: [{ title: "My Projects — Client Portal" }] }),
  component: Portal,
});

function Portal() {
  const mine = projects.filter((p) => p.clientId === "c1");
  return (
    <PortalLayout title="My Projects">
      <h1 className="text-2xl font-bold tracking-tight">Welcome back, Ahmed</h1>
      <p className="mt-1 text-sm text-muted-foreground">Here are your active projects with Tela Studio.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {mine.map((p) => (
          <Link key={p.id} to="/portal/projects/$id" params={{ id: p.id }}>
            <Card className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{p.name}</p>
                <StatusBadge status={p.status} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Due {p.deadline}</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${p.progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{p.progress}% complete</p>
            </Card>
          </Link>
        ))}
      </div>
    </PortalLayout>
  );
}