import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Phone, Plus, Search, Users, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/portal/DashboardLayout";
import { Avatar, Card, EmptyState } from "@/components/portal/Bits";
import { Field, inputCls } from "@/components/portal/AuthShell";
import { clientsApi, authApi } from "@/lib/api";

export const Route = createFileRoute("/clients")({
  head: () => ({ meta: [{ title: "Clients — Tela" }] }),
  component: Clients,
});

function Clients() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll()
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete client');
    }
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const clients = data?.data || [];
  
  const filtered = clients.filter(
    (c: any) =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      (c.company || '').toLowerCase().includes(q.toLowerCase()) ||
      c.email.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <DashboardLayout title="Clients">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
          <p className="mt-1 text-sm text-muted-foreground">{clients.length} clients in your studio.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search clients…"
              className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm outline-none transition focus:border-primary sm:w-64"
            />
          </div>
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
            <Plus className="h-4 w-4" /> Add Client
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 text-center text-muted-foreground">Loading clients...</div>
      ) : filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No clients yet"
            description="Try a different search, or invite your first client to get started."
            action={
              <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                <Plus className="h-4 w-4" /> Add Client
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c: any) => (
            <Card key={c._id} className="p-5">
              <div className="flex items-center gap-3">
                <Avatar name={c.name} className="h-12 w-12" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{c.company || 'No company'}</p>
                </div>
                {c.status === 'pending' && (
                  <div className="flex-shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    Pending
                  </div>
                )}
                {c.status === 'active' && (
                  <div className="flex-shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                    Active
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /><span className="truncate">{c.email}</span></div>
                {c.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /><span>{c.phone}</span></div>}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="text-xs text-muted-foreground">
                  {c.status === 'pending' ? `Invited ${new Date(c.invitedAt || c.createdAt).toLocaleDateString()}` : `Joined ${new Date(c.joinedAt || c.createdAt).toLocaleDateString()}`}
                </span>
                <div className="flex gap-2">
                  <Link to="/clients/$id" params={{ id: c._id }} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-muted">View</Link>
                  <button
                    onClick={() => handleDelete(c._id, c.name)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {open && <AddClient onClose={() => setOpen(false)} />}
    </DashboardLayout>
  );
}

function AddClient({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [f, setF] = useState({ name: "", email: "", company: "", phone: "" });
  
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Invite client - this creates both User and Client records
      return await authApi.inviteClient(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(`Invitation sent to ${f.email}`);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to invite client');
    }
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(f);
  }
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-xl animate-in slide-in-from-right">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h3 className="font-semibold">Add Client</h3>
            <p className="text-xs text-muted-foreground">They'll receive an invite link to set their password.</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={submit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <Field label="Full name"><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} /></Field>
          <Field label="Email"><input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={inputCls} /></Field>
          <Field label="Company"><input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} className={inputCls} /></Field>
          <Field label="Phone"><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={inputCls} /></Field>
        </form>
        <div className="border-t border-border p-4 flex gap-2 justify-end">
          <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
          <button onClick={submit as any} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Send Invite</button>
        </div>
      </aside>
    </div>
  );
}