import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft, CheckCircle2, Clock, Paperclip, Send, FileText as FileIcon,
  Image as ImageIcon, Archive, Download, Eye, Plus, Upload, Play, Receipt,
  X, Calendar, DollarSign, Sparkles, MoreHorizontal, ChevronRight, Trash2,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/portal/DashboardLayout";
import { Avatar, Card, StatusBadge, EmptyState } from "@/components/portal/Bits";
import { projectsApi, milestonesApi, feedApi, filesApi, invoicesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Status } from "@/lib/data";
import { normalizeProjectStatus } from "@/lib/data";
import { useFeedUnread } from "@/lib/feed-read";
import { cn, minDateInputValue, isPastDateInput } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export const Route = createFileRoute("/projects/$id")({
  head: () => ({ meta: [{ title: "Project — Tela" }] }),
  component: ProjectDetail,
  notFoundComponent: () => (
    <DashboardLayout title="Not found"><p className="text-sm text-muted-foreground">Project not found.</p></DashboardLayout>
  ),
});

const TABS = ["overview", "feed", "files", "invoices"] as const;
type Tab = (typeof TABS)[number];

const fmtMoney = (amt: number) => `$${amt.toLocaleString()}`;

function normalizeStatus(status: string): Status {
  if (status === 'in-progress') return 'in_progress';
  if (status === 'planning') return 'pending';
  return status as Status;
}

function formatDate(date?: string | Date) {
  if (!date) return 'No deadline';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function filesForMilestone(files: any[], milestoneId: string) {
  return files.filter((f) => {
    const mid = f.milestone?._id || f.milestone;
    return mid?.toString() === milestoneId;
  });
}

function ProjectDetail() {
  const { user: authUser, isAuthenticated } = useRequireAuth('freelancer');
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, activeRole } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [showNew, setShowNew] = useState(false);
  const [uploadFor, setUploadFor] = useState<any | null>(null);
  const [draft, setDraft] = useState("");

  if (!isAuthenticated) {
    return <DashboardLayout title="Loading..."><div>Loading...</div></DashboardLayout>;
  }

  const { data: projectData, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getById(id),
    retry: false,
  });

  const { data: milestonesData } = useQuery({
    queryKey: ['milestones', id],
    queryFn: () => milestonesApi.getAll(id),
    enabled: !!id,
  });

  const { data: feedData } = useQuery({
    queryKey: ['feed', id],
    queryFn: () => feedApi.getMessages(id),
    enabled: !!id,
    refetchInterval: 15000,
  });

  const { data: filesData } = useQuery({
    queryKey: ['files', id],
    queryFn: () => filesApi.getAll(id),
    enabled: !!id,
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoicesApi.getAll({ project: id } as any),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ milestoneId, data }: { milestoneId: string; data: any }) =>
      milestonesApi.update(id, milestoneId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update milestone'),
  });

  const deleteFileMutation = useMutation({
    mutationFn: (fileId: string) => filesApi.delete(id, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', id] });
      toast.success('Deliverable deleted');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete deliverable'),
  });

  const p = projectData?.data;
  const ms = (milestonesData?.data || []).map((m: any) => ({ ...m, status: normalizeStatus(m.status) }));
  const msgs = feedData?.data || [];
  const fileList = filesData?.data || [];
  const invs = invoicesData?.data || [];
  const feedRole = activeRole === 'client' ? 'client' : 'freelancer';
  const unreadFeedCount = useFeedUnread(id, feedRole, msgs, user?._id, tab === 'feed');

  const totals = useMemo(() => {
    const billed = ms.reduce((s: number, m: any) => s + (m.amount || 0), 0);
    const paid = invs.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + (i.total || 0), 0);
    const approved = ms.filter((m: any) => m.status === 'approved').length;
    return { billed, paid, approved, total: ms.length };
  }, [ms, invs]);

  if (isLoading) {
    return <DashboardLayout title="Loading..."><div className="text-center text-muted-foreground">Loading project...</div></DashboardLayout>;
  }

  if (error) {
    return <DashboardLayout title="Error"><div className="text-center text-destructive">Error loading project: {(error as any).message}</div></DashboardLayout>;
  }

  if (!p) throw notFound();

  const client = p.client;

  const startWork = (m: any) => {
    updateMutation.mutate({ milestoneId: m._id, data: { status: 'in_progress' } });
    toast.success(`Started "${m.name}"`);
  };

  const markComplete = (m: any) => {
    updateMutation.mutate({ milestoneId: m._id, data: { status: 'under_review' } });
    toast.success('Marked for review', { description: 'Client has been notified.' });
  };

  const createInvoice = (m: any) => {
    navigate({
      to: "/invoices/new",
      search: {
        project: id,
        milestone: m._id,
        client: client._id,
      },
    });
  };

  const postUpdate = async () => {
    if (!draft.trim()) return;
    try {
      const formData = new FormData();
      formData.append('message', draft.trim());
      await feedApi.createMessage(id, formData);
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['feed', id] });
      toast.success('Update posted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to post update');
    }
  };

  return (
    <DashboardLayout title={p.name}>
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      <Card className="mt-4 overflow-hidden p-0">
        <div className="grid gap-px bg-border md:grid-cols-[1.4fr_1fr]">
          <div className="bg-card p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{p.name}</h2>
              <StatusBadge status={normalizeProjectStatus(p.status)} />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={client?.name ?? ''} className="h-8 w-8" />
              <div className="text-sm">
                <p className="font-medium">{client?.name}</p>
                <p className="text-xs text-muted-foreground">{client?.company} • {client?.email}</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Project progress</span>
                <span className="font-semibold tabular-nums">{totals.approved}/{totals.total} milestones approved</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${totals.total ? (totals.approved / totals.total) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 bg-card">
            <Stat label="Budget" value={fmtMoney(p.budget || 0)} />
            <Stat label="Billed" value={fmtMoney(totals.billed)} />
            <Stat label="Paid" value={fmtMoney(totals.paid)} accent />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Deadline {formatDate(p.deadline)}</span>
          <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Shared with {client?.name}</span>
        </div>
      </Card>

      <div className="mt-6 flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("relative px-4 py-2.5 text-sm font-medium capitalize transition", tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t}
            {t === "feed" && unreadFeedCount > 0 && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                {unreadFeedCount}
              </span>
            )}
            {t === "files" && fileList.length > 0 && <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{fileList.length}</span>}
            {t === "invoices" && invs.length > 0 && <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{invs.length}</span>}
            {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Milestones</h3>
                <p className="text-xs text-muted-foreground">Break the project into deliverable steps. Each unlocks an invoice when approved.</p>
              </div>
              <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                <Plus className="h-4 w-4" /> Add Milestone
              </button>
            </div>

            {ms.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="h-6 w-6" />}
                title="No milestones yet"
                description="Break the project into 3–5 milestones so your client knows exactly what to expect and when."
                action={<button onClick={() => setShowNew(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Create first milestone</button>}
              />
            ) : (
              <ol className="relative space-y-3 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-border">
                {ms.map((m: any, i: number) => (
                  <MilestoneRow
                    key={m._id}
                    index={i + 1}
                    m={m}
                    deliverables={filesForMilestone(fileList, m._id)}
                    invoice={invs.find((iv: any) => iv.milestone === m._id || iv.milestone?._id === m._id)}
                    onStart={() => startWork(m)}
                    onUpload={() => setUploadFor(m)}
                    onComplete={() => markComplete(m)}
                    onInvoice={() => createInvoice(m)}
                    onDeleteDeliverable={(fileId) => deleteFileMutation.mutate(fileId)}
                    deletingDeliverable={deleteFileMutation.isPending}
                    updating={updateMutation.isPending}
                  />
                ))}
              </ol>
            )}
          </div>
        )}

        {tab === "feed" && <FeedTab messages={msgs} draft={draft} setDraft={setDraft} onPost={postUpdate} />}
        {tab === "files" && <FilesTab projectId={id} files={fileList} milestones={ms} />}
        {tab === "invoices" && <InvoicesTab invoices={invs} milestones={ms} />}
      </div>

      {showNew && <NewMilestoneModal projectId={id} onClose={() => setShowNew(false)} />}
      {uploadFor && <UploadModal projectId={id} milestone={uploadFor} onClose={() => setUploadFor(null)} />}
    </DashboardLayout>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-lg font-bold tabular-nums", accent && "text-success")}>{value}</p>
    </div>
  );
}

function MilestoneRow({ index, m, deliverables, invoice, onStart, onUpload, onComplete, onInvoice, onDeleteDeliverable, deletingDeliverable, updating }: {
  index: number;
  m: any;
  deliverables: any[];
  invoice?: any;
  onStart: () => void;
  onUpload: () => void;
  onComplete: () => void;
  onInvoice: () => void;
  onDeleteDeliverable: (fileId: string) => void;
  deletingDeliverable: boolean;
  updating: boolean;
}) {
  const [open, setOpen] = useState(m.status === 'in_progress' || m.status === 'under_review');
  const done = m.status === 'approved';
  const active = m.status === 'in_progress' || m.status === 'under_review';

  return (
    <li className="relative">
      <div className={cn(
        "ml-10 rounded-xl border bg-card transition",
        done ? "border-success/30" : active ? "border-primary/40 shadow-sm" : "border-border",
      )}>
        <span className={cn(
          "absolute -left-0 top-3 grid h-10 w-10 place-items-center rounded-full border-2 text-xs font-bold",
          done ? "border-success bg-success text-success-foreground" :
          active ? "border-primary bg-primary text-primary-foreground" :
          "border-border bg-background text-muted-foreground",
        )}>
          {done ? <CheckCircle2 className="h-5 w-5" /> : active ? <Clock className="h-5 w-5" /> : index}
        </span>

        <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{m.name}</p>
              <StatusBadge status={m.status} />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Due {formatDate(m.dueDate)} • <span className="font-semibold text-foreground">{fmtMoney(m.amount || 0)}</span>
              {deliverables.length > 0 && <> • {deliverables.length} deliverable{deliverables.length > 1 ? 's' : ''}</>}
            </p>
          </div>
          <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground transition", open && "rotate-90")} />
        </button>

        {open && (
          <div className="border-t border-border p-4 space-y-3">
            {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}

            {deliverables.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Deliverables</p>
                <ul className="space-y-1.5">
                  {deliverables.map((d: any) => (
                    <li key={d._id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5">
                      <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 flex-1 truncate text-xs font-medium hover:underline"
                      >
                        {d.fileName || d.name}
                      </a>
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="View file"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => onDeleteDeliverable(d._id)}
                        disabled={deletingDeliverable}
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                        title="Delete deliverable"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {invoice && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2.5 text-xs">
                <Receipt className="h-4 w-4 text-primary" />
                <span className="font-medium">{invoice.invoiceNumber}</span>
                <span className="text-muted-foreground">• {fmtMoney(invoice.total || 0)}</span>
                <StatusBadge status={invoice.status} className="ml-auto" />
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {(m.status === 'pending' || m.status === 'planning') && (
                <button onClick={onStart} disabled={updating} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                  <Play className="h-3.5 w-3.5" /> Start work
                </button>
              )}
              {(m.status === 'in_progress' || m.status === 'under_review') && (
                <button onClick={onUpload} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted">
                  <Upload className="h-3.5 w-3.5" /> Upload deliverable
                </button>
              )}
              {m.status === 'in_progress' && (
                <button onClick={onComplete} disabled={updating} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Mark complete
                </button>
              )}
              {m.status === 'under_review' && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Waiting for client approval
                </span>
              )}
              {m.status === 'approved' && !invoice && (
                <button onClick={onInvoice} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
                  <Receipt className="h-3.5 w-3.5" /> Create invoice
                </button>
              )}
              <button className="ml-auto grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

function NewMilestoneModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const valid = name.trim() && dueDate && Number(amount) > 0;

  const handleSubmit = async () => {
    if (!valid) return;
    if (isPastDateInput(dueDate)) {
      toast.error('Milestone due date cannot be in the past');
      return;
    }
    setLoading(true);
    try {
      await milestonesApi.create(projectId, { name: name.trim(), dueDate, amount: Number(amount) });
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
      toast.success('Milestone added', { description: `${name.trim()} • ${fmtMoney(Number(amount))}` });
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add milestone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="New milestone" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. UI Design" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Due date" icon={<Calendar className="h-3.5 w-3.5" />}>
            <input type="date" min={minDateInputValue()} value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </Field>
          <Field label="Amount" icon={<DollarSign className="h-3.5 w-3.5" />}>
            <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="300" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
          <button disabled={!valid || loading} onClick={handleSubmit} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function UploadModal({ projectId, milestone, onClose }: { projectId: string; milestone: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('milestoneId', milestone._id);
      await filesApi.upload(projectId, formData);
      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
      toast.success('Deliverable uploaded', { description: file.name });
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal title={`Upload deliverable — ${milestone.name}`} onClose={onClose}>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center hover:bg-muted/50"
        >
          <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">{uploading ? 'Uploading...' : 'Drop files here or click to browse'}</p>
          <p className="text-xs text-muted-foreground">PDF, ZIP, PNG, JPG up to 50MB</p>
        </button>
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
      </div>
    </Modal>
  );
}

function FeedTab({ messages, draft, setDraft, onPost }: { messages: any[]; draft: string; setDraft: (v: string) => void; onPost: () => void }) {
  const { user } = useAuth();
  return (
    <Card className="flex h-[600px] flex-col">
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No messages yet. Post an update for your client!</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender?._id === user?._id;
            return (
              <div key={m._id} className={cn("flex gap-3", mine && "flex-row-reverse")}>
                <Avatar name={m.sender?.name || 'User'} />
                <div className={cn("max-w-md", mine && "text-right")}>
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{m.sender?.name}</span>
                    <span>{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  <div className={cn("rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap", mine ? "bg-primary text-primary-foreground" : "bg-muted")}>{m.message}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onPost()}
            placeholder="Post an update for your client…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <button onClick={onPost} className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground hover:opacity-90"><Send className="h-4 w-4" /></button>
        </div>
      </div>
    </Card>
  );
}

function FilesTab({ projectId, files, milestones }: { projectId: string; files: any[]; milestones: any[] }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await filesApi.upload(projectId, formData);
      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
      toast.success('File uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload');
    } finally {
      setUploading(false);
    }
  };

  if (files.length === 0) {
    return (
      <EmptyState
        icon={<Upload className="h-6 w-6" />}
        title="No deliverables yet"
        description="Upload deliverables from a milestone to share them with your client."
        action={
          <button onClick={() => inputRef.current?.click()} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            {uploading ? 'Uploading...' : 'Upload file'}
          </button>
        }
      />
    );
  }

  return (
    <>
      <input ref={inputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
      <div className="mb-4">
        <button onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {files.map((f) => {
          const Icon = (f.fileName || f.name || '').endsWith('.pdf') ? FileIcon : (f.fileName || f.name || '').endsWith('.zip') ? Archive : ImageIcon;
          return (
            <Card key={f._id} className="flex flex-col gap-3 p-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{f.fileName || f.name}</p>
                <p className="text-xs text-muted-foreground">{f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ''}</p>
              </div>
              <a href={f.fileUrl || f.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs font-medium hover:bg-muted">
                <Download className="h-3.5 w-3.5" /> Download
              </a>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function InvoicesTab({ invoices, milestones }: { invoices: any[]; milestones: any[] }) {
  if (invoices.length === 0) {
    return (
      <EmptyState icon={<Receipt className="h-6 w-6" />} title="No invoices yet" description="Once a milestone is approved you can optionally send an invoice from the timeline." />
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-5 py-2.5 text-left font-medium">Invoice</th>
            <th className="px-5 py-2.5 text-left font-medium">Milestone</th>
            <th className="px-5 py-2.5 text-left font-medium">Amount</th>
            <th className="px-5 py-2.5 text-left font-medium">Due</th>
            <th className="px-5 py-2.5 text-left font-medium">Status</th>
            <th className="px-5 py-2.5 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((i) => {
            const m = milestones.find((x) => x._id === i.milestone || x._id === i.milestone?._id);
            return (
              <tr key={i._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-5 py-3 font-medium">{i.invoiceNumber}</td>
                <td className="px-5 py-3 text-muted-foreground">{m?.name ?? '—'}</td>
                <td className="px-5 py-3 font-semibold tabular-nums">{fmtMoney(i.total || 0)}</td>
                <td className="px-5 py-3 text-muted-foreground">{i.dueDate ? formatDate(i.dueDate) : '—'}</td>
                <td className="px-5 py-3"><StatusBadge status={i.status} /></td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button title="View" className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-muted"><Eye className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">{icon}{label}</span>
      {children}
    </label>
  );
}
