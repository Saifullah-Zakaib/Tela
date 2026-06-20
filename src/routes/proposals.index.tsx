import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, ExternalLink, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/portal/DashboardLayout";
import { Card, StatusBadge } from "@/components/portal/Bits";
import { proposalsApi } from "@/lib/api";
import { fmtMoney } from "@/lib/data";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export const Route = createFileRoute("/proposals/")({
  head: () => ({ meta: [{ title: "Proposals — Tela" }] }),
  component: Proposals,
});

function Proposals() {
  const { user, isAuthenticated } = useRequireAuth('freelancer');
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <DashboardLayout title="Loading..."><div>Loading...</div></DashboardLayout>;
  }
  
  const { data, isLoading } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => proposalsApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => proposalsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposal deleted and client notified');
      setDeleteConfirm(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete proposal');
    },
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
            <Card key={p._id} className="p-5 relative">
              <button
                onClick={() => setDeleteConfirm(p._id)}
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                title="Delete proposal"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              
              <div className="flex items-start justify-between gap-2 pr-8">
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

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDeleteConfirm(null)}>
          <Card className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Delete Proposal?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This will permanently delete the proposal and notify the client via email. This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
