import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/portal/DashboardLayout";
import { Card, StatusBadge } from "@/components/portal/Bits";
import { proposalsApi } from "@/lib/api";
import { fmtMoney } from "@/lib/data";

export const Route = createFileRoute("/proposals")({
  head: () => ({ meta: [{ title: "Proposals — Tela" }] }),
  component: Proposals,
});

function Proposals() {
  const { data, isLoading } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => proposalsApi.getAll()
  });

  const proposals = data?.data || [];

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
      
      {isLoading ? (
        <div className="mt-6 text-center text-muted-foreground">Loading proposals...</div>
      ) : proposals.length === 0 ? (
        <Card className="mt-6 p-8 text-center">
          <p className="text-sm text-muted-foreground">No proposals yet. Create your first proposal to get started.</p>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {proposals.map((p: any) => (
            <Card key={p._id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{p.title}</p>
                <StatusBadge status={p.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.client?.company || p.client?.name}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="text-xs text-muted-foreground">
                  Sent {new Date(p.createdAt).toLocaleDateString()}
                </span>
                <span className="text-lg font-bold">{fmtMoney(p.price)}</span>
              </div>
              {p.publicSlug && (
                <a 
                  href={`${window.location.origin}/proposals/public/${p.publicSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  View public link <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}