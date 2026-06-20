import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/portal/DashboardLayout";
import { Card, StatusBadge } from "@/components/portal/Bits";
import { projectsApi, clientsApi } from "@/lib/api";
import { type Status, normalizeProjectStatus } from "@/lib/data";
import { minDateInputValue, isPastDateInput } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export const Route = createFileRoute("/projects/")({
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
  const { user, isAuthenticated } = useRequireAuth('freelancer');
  const [createOpen, setCreateOpen] = useState(false);
  const [filterClient, setFilterClient] = useState<string>('');
  const queryClient = useQueryClient();

  if (!isAuthenticated) {
    return <DashboardLayout title="Loading..."><div>Loading...</div></DashboardLayout>;
  }

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll()
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll()
  });

  const projects = data?.data || [];
  const clients = clientsData?.data || [];

  const filteredProjects = filterClient 
    ? projects.filter((p: any) => p.client?._id === filterClient)
    : projects;

  return (
    <DashboardLayout title="Projects">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : `${filteredProjects.length} projects across your studio.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select 
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="h-10 rounded-xl border border-input bg-card px-3 text-sm outline-none"
          >
            <option value="">All clients</option>
            {clients.map((c: any) => (
              <option key={c._id} value={c._id}>{c.company || c.name}</option>
            ))}
          </select>
          <button 
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Create Project
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 text-center text-muted-foreground">Loading projects...</div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => {
            const items = filteredProjects.filter((p: any) => normalizeProjectStatus(p.status) === col.id);
            return (
              <div key={col.id} className="rounded-2xl border border-border bg-muted/30 p-3">
                <div className="mb-3 flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{col.label}</span>
                    <span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">{items.length}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {items.map((p: any) => (
                    <Card 
                      key={p._id} 
                      className="p-4 transition hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm leading-snug">{p.name}</p>
                        <StatusBadge status={normalizeProjectStatus(p.status)} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{p.client?.company || p.client?.name}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Due {p.deadline ? new Date(p.deadline).toLocaleDateString() : 'No deadline'}</span>
                        <span>${p.budget?.toLocaleString() || 0}</span>
                      </div>
                      <Link
                        to="/projects/$id"
                        params={{ id: p._id }}
                        className="mt-3 block w-full rounded-lg border border-border bg-background px-3 py-2 text-center text-xs font-medium hover:bg-muted"
                      >
                        View Details →
                      </Link>
                    </Card>
                  ))}
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
      )}

      {createOpen && (
        <CreateProjectDialog 
          clients={clients}
          onClose={() => setCreateOpen(false)} 
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setCreateOpen(false);
          }}
        />
      )}
    </DashboardLayout>
  );
}

function CreateProjectDialog({ clients, onClose, onSuccess }: { clients: any[]; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    description: '',
    budget: '',
    deadline: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.deadline && isPastDateInput(formData.deadline)) {
      toast.error('Project deadline cannot be in the past');
      return;
    }

    setLoading(true);

    try {
      const projectData = {
        name: formData.name,
        clientId: formData.client,
        description: formData.description,
        budget: Number(formData.budget),
        deadline: formData.deadline,
      };

      await projectsApi.create(projectData);
      toast.success('Project created successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto m-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Create New Project</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Project Name*</label>
            <input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Brand Identity Design"
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Client*</label>
            <select
              required
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            >
              <option value="">Select client</option>
              {clients.map((c: any) => (
                <option key={c._id} value={c._id}>{c.company || c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Project description..."
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none resize-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Budget*</label>
              <input
                type="number"
                required
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="5000"
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Deadline</label>
              <input
                type="date"
                min={minDateInputValue()}
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            New projects start in Planning. Status updates automatically as you work through milestones.
          </p>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
