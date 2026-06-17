import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { DashboardLayout } from "@/components/portal/DashboardLayout";
import { Card, StatusBadge } from "@/components/portal/Bits";
import { proposals, clientById, fmtMoney } from "@/lib/data";

export const Route = createFileRoute("/proposals")({
  head: () => ({ meta: [{ title: "Proposals — Tela" }] }),
  component: Proposals,
});

function Proposals() {
  return (
    <DashboardLayout title="Proposals">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Proposals</h2>
          <p className="mt-1 text-sm text-muted-foreground">Win more work with beautiful, ready-to-share proposals.</p>
        </div>
        <Link to="/proposals/new" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> New Proposal
        </Link>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {proposals.map((p) => {
          const c = clientById(p.clientId);
          return (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{p.title}</p>
                <StatusBadge status={p.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{c?.company}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="text-xs text-muted-foreground">Sent {p.sent}</span>
                <span className="text-lg font-bold">{fmtMoney(p.total)}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}