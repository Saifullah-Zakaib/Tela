import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Circle, Clock, Paperclip, Send, FileText as FileIcon, Image as ImageIcon, Archive, Download, Eye, Trash2, Edit, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/portal/DashboardLayout";
import { Avatar, Card, StatusBadge } from "@/components/portal/Bits";
import { projectsApi, milestonesApi, feedApi, filesApi, invoicesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { type Status } from "@/lib/data";

export const Route = createFileRoute("/projects/$id")({
  head: () => ({ meta: [{ title: "Project — Tela" }] }),
  component: ProjectDetail,
  notFoundComponent: () => (
    <DashboardLayout title="Not found"><p className="text-sm text-muted-foreground">Project not found.</p></DashboardLayout>
  ),
});

const TABS = ["overview", "feed", "files", "invoices"] as const;

function ProjectDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<(typeof TABS)[number]>("overview");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getById(id)
  });

  const { data: milestonesData } = useQuery({
    queryKey: ['milestones', id],
    queryFn: () => milestonesApi.getAll(id),
    enabled: !!id
  });

  const { data: feedData } = useQuery({
    queryKey: ['feed', id],
    queryFn: () => feedApi.getMessages(id),
    enabled: !!id
  });

  const { data: filesData } = useQuery({
    queryKey: ['files', id],
    queryFn: () => filesApi.getAll(id),
    enabled: !!id
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.delete(id),
    onSuccess: () => {
      toast.success('Project deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.navigate({ to: '/projects' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete project');
    }
  });

  if (isLoading) {
    return <DashboardLayout title="Loading..."><div className="text-center text-muted-foreground">Loading project...</div></DashboardLayout>;
  }

  const p = projectData?.data;
  if (!p) throw notFound();

  const ms = milestonesData?.data || [];
  const msgs = feedData?.data || [];
  const files = filesData?.data || [];

  const fmtMoney = (amt: number) => `$${amt.toLocaleString()}`;

  return (
    <DashboardLayout title={p.name}>
      <div className="flex items-center justify-between">
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
        <button
          onClick={() => setDeleteOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-destructive px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete Project
        </button>
      </div>

      <Card className="mt-4 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold">{p.name}</h2>
              <StatusBadge status={p.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{p.client?.company || p.client?.name}</p>
          </div>
          <div className="flex flex-wrap gap-6">
            <div><p className="text-xs text-muted-foreground">Deadline</p><p className="text-sm font-semibold">{p.deadline ? new Date(p.deadline).toLocaleDateString() : 'No deadline'}</p></div>
            <div><p className="text-xs text-muted-foreground">Budget</p><p className="text-sm font-semibold">{fmtMoney(p.budget || 0)}</p></div>
            <div><p className="text-xs text-muted-foreground">Progress</p><p className="text-sm font-semibold">{p.progress || 0}%</p></div>
          </div>
        </div>
      </Card>

      <div className="mt-6 flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("relative px-4 py-2.5 text-sm font-medium capitalize transition", tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t}
            {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && <OverviewTab projectId={id} milestones={ms} />}
        {tab === "feed" && <FeedTab projectId={id} messages={msgs} />}
        {tab === "files" && <FilesTab projectId={id} files={files} />}
        {tab === "invoices" && <InvoicesTab projectId={id} />}
      </div>

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteOpen(false)} />
          <Card className="relative w-full max-w-md m-4 p-6">
            <h3 className="text-lg font-semibold mb-2">Delete Project</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteOpen(false)}
                className="flex-1 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
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


function OverviewTab({ projectId, milestones }: { projectId: string; milestones: any[] }) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      milestonesApi.update(projectId, id, data),
    onSuccess: () => {
      toast.success('Milestone updated');
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update milestone');
    }
  });

  const handleMarkComplete = (milestoneId: string) => {
    updateMutation.mutate({
      id: milestoneId,
      data: { status: 'completed' }
    });
  };

  const fmtMoney = (amt: number) => `$${amt.toLocaleString()}`;

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Milestone Timeline</h3>
          <button
            onClick={() => setAddOpen(true)}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            Add Milestone
          </button>
        </div>
        {milestones.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">No milestones yet.</p>
        ) : (
          <ol className="mt-6 space-y-6">
            {milestones.map((m, i) => {
              const done = m.status === "approved" || m.status === "completed";
              const active = m.status === "in_progress" || m.status === "under_review";
              return (
                <li key={m._id} className="relative flex gap-4 pl-10">
                  {i < milestones.length - 1 && <span className="absolute left-[15px] top-8 h-full w-px bg-border" />}
                  <span className={cn(
                    "absolute left-0 top-1 grid h-8 w-8 place-items-center rounded-full border-2",
                    done ? "border-success bg-success text-success-foreground" : active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground",
                  )}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : active ? <Clock className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{m.name}</p>
                      <StatusBadge status={m.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Due {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'No deadline'} • {fmtMoney(m.amount || 0)}
                    </p>
                    {active && (
                      <button 
                        onClick={() => handleMarkComplete(m._id)}
                        disabled={updateMutation.isPending}
                        className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
      {addOpen && <AddMilestoneDialog projectId={projectId} onClose={() => setAddOpen(false)} />}
    </>
  );
}

function AddMilestoneDialog({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    dueDate: '',
    status: 'planning' as Status,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await milestonesApi.create(projectId, {
        ...formData,
        amount: Number(formData.amount)
      });
      toast.success('Milestone added successfully');
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add milestone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto m-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add Milestone</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Milestone Name*</label>
            <input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Design Phase"
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Milestone description..."
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none resize-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Amount*</label>
              <input
                type="number"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="2500"
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Status })}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            >
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="under_review">Under Review</option>
              <option value="completed">Completed</option>
              <option value="approved">Approved</option>
            </select>
          </div>

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
              {loading ? 'Adding...' : 'Add Milestone'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function FeedTab({ projectId, messages }: { projectId: string; messages: any[] }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('message', message);
      
      await feedApi.createMessage(projectId, formData);
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['feed', projectId] });
      toast.success('Message sent');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="flex h-[600px] flex-col">
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender?._id === user?._id;
            return (
              <div key={m._id} className={cn("flex gap-3", mine && "flex-row-reverse")}>
                <Avatar name={m.sender?.name || 'User'} />
                <div className={cn("max-w-md", mine && "text-right")}>
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{m.sender?.name}</span>
                    <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className={cn("rounded-2xl px-4 py-2.5 text-sm", mine ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    {m.message}
                  </div>
                  {m.attachments && m.attachments.length > 0 && (
                    <div className={cn("mt-2 flex flex-wrap gap-1.5", mine && "justify-end")}>
                      {m.attachments.map((a: any, idx: number) => (
                        <a 
                          key={idx}
                          href={a.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs hover:bg-muted"
                        >
                          <Paperclip className="h-3 w-3" /> {a.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2">
          <input 
            placeholder="Type a message…" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !sending && handleSend()}
            className="flex-1 bg-transparent text-sm outline-none" 
          />
          <button 
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}

function FilesTab({ projectId, files }: { projectId: string; files: any[] }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await filesApi.upload(projectId, formData);
      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
      toast.success('File uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => filesApi.delete(projectId, fileId),
    onSuccess: () => {
      toast.success('File deleted');
      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete file');
    }
  });

  return (
    <>
      <div className="mb-4">
        <label className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 cursor-pointer">
          {uploading ? 'Uploading...' : 'Upload File'}
          <input 
            type="file" 
            onChange={handleFileUpload} 
            disabled={uploading}
            className="hidden" 
          />
        </label>
      </div>

      {files.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {files.map((f) => {
            const Icon = f.name.endsWith('.pdf') ? FileIcon : f.name.endsWith('.zip') ? Archive : ImageIcon;
            return (
              <Card key={f._id} className="flex flex-col gap-3 p-4">
                <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(f.uploadedAt).toLocaleDateString()} • {f.uploadedBy?.name}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                  <button
                    onClick={() => deleteMutation.mutate(f._id)}
                    disabled={deleteMutation.isPending}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-destructive text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function InvoicesTab({ projectId }: { projectId: string }) {
  const { data: invoicesData } = useQuery({
    queryKey: ['invoices', projectId],
    queryFn: () => invoicesApi.getAll({ project: projectId } as any),
    enabled: !!projectId
  });

  const invoices = invoicesData?.data || [];
  const fmtMoney = (amt: number) => `$${amt.toLocaleString()}`;

  return (
    <Card className="overflow-hidden">
      {invoices.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No invoices for this project yet.</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-2.5 text-left font-medium">Invoice</th>
              <th className="px-5 py-2.5 text-left font-medium">Amount</th>
              <th className="px-5 py-2.5 text-left font-medium">Due</th>
              <th className="px-5 py-2.5 text-left font-medium">Status</th>
              <th className="px-5 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((i: any) => (
              <tr key={i._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-5 py-3 font-medium">{i.invoiceNumber}</td>
                <td className="px-5 py-3">{fmtMoney(i.amount)}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  {i.dueDate ? new Date(i.dueDate).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-5 py-3"><StatusBadge status={i.status} /></td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1.5">
                    <Link 
                      to="/invoices"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-muted"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
