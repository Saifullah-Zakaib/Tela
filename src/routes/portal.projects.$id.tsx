import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft, CheckCircle2, Circle, Clock, CreditCard, Download, FileText,
  Image as ImageIcon, Archive, Lock, ThumbsUp, Calendar, Sparkles, Paperclip,
  MessageSquare, X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Avatar, Card, StatusBadge } from "@/components/portal/Bits";
import { projectsApi, milestonesApi, feedApi, filesApi, invoicesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Status } from "@/lib/data";
import { normalizeProjectStatus } from "@/lib/data";
import { useFeedUnread } from "@/lib/feed-read";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export const Route = createFileRoute("/portal/projects/$id")({
  head: () => ({ meta: [{ title: "Project — Client Portal" }] }),
  component: PortalProject,
  notFoundComponent: () => (
    <PortalLayout><p className="text-sm text-muted-foreground">Project not found.</p></PortalLayout>
  ),
});

const TABS = ["overview", "feed", "files", "invoices"] as const;

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

function PortalProject() {
  const { user: authUser, isAuthenticated } = useRequireAuth('client');
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>("overview");
  const [requestChangesFor, setRequestChangesFor] = useState<any | null>(null);

  if (!isAuthenticated) {
    return <PortalLayout title="Loading..."><div>Loading...</div></PortalLayout>;
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

  const approveMutation = useMutation({
    mutationFn: (milestoneId: string) =>
      milestonesApi.update(id, milestoneId, { status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Milestone approved', { description: 'Your freelancer has been notified.' });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to approve milestone'),
  });

  const requestChangesMutation = useMutation({
    mutationFn: ({ milestoneId, message }: { milestoneId: string; message: string }) =>
      milestonesApi.requestChanges(id, milestoneId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', id] });
      queryClient.invalidateQueries({ queryKey: ['feed', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Changes requested', { description: 'Your freelancer has been notified.' });
      setRequestChangesFor(null);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to send feedback'),
  });

  const p = projectData?.data;
  const ms = (milestonesData?.data || []).map((m: any) => ({ ...m, status: normalizeStatus(m.status) }));
  const msgs = feedData?.data || [];
  const files = filesData?.data || [];
  const invs = invoicesData?.data || [];
  const unreadFeedCount = useFeedUnread(id, 'client', msgs, user?._id, tab === 'feed');

  const totals = useMemo(() => {
    const approved = ms.filter((m: any) => m.status === 'approved').length;
    return { approved, total: ms.length };
  }, [ms]);

  if (isLoading) {
    return <PortalLayout title="Loading..."><div className="text-center text-muted-foreground">Loading project...</div></PortalLayout>;
  }

  if (error) {
    return <PortalLayout title="Error"><div className="text-center text-destructive">{(error as any).message}</div></PortalLayout>;
  }

  if (!p) throw notFound();

  return (
    <PortalLayout title={p.name}>
      <Link to="/portal" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All projects
      </Link>

      <Card className="mt-4 overflow-hidden p-0">
        <div className="bg-card p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{p.name}</h1>
            <StatusBadge status={normalizeProjectStatus(p.status)} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Due {formatDate(p.deadline)}</p>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Project progress</span>
              <span className="font-semibold">{totals.approved}/{totals.total} milestones approved</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${totals.total ? (totals.approved / totals.total) * 100 : 0}%` }} />
            </div>
          </div>
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
            {t === "files" && files.length > 0 && <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{files.length}</span>}
            {t === "invoices" && invs.length > 0 && <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{invs.length}</span>}
            {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && (
          <Card className="p-6">
            <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> Review milestones and approve completed work.
            </div>
            <ol className="mt-6 space-y-4">
              {ms.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No milestones yet.</p>
              ) : (
                ms.map((m: any, i: number) => {
                  const done = m.status === 'approved';
                  const active = m.status === 'in_progress' || m.status === 'under_review';
                  const deliverables = filesForMilestone(files, m._id);
                  return (
                    <li key={m._id} className="relative flex gap-4 pl-10">
                      {i < ms.length - 1 && <span className="absolute left-[15px] top-8 h-full w-px bg-border" />}
                      <span className={cn(
                        "absolute left-0 top-1 grid h-8 w-8 place-items-center rounded-full border-2",
                        done ? "border-success bg-success text-success-foreground" :
                        active ? "border-primary bg-primary/10 text-primary" :
                        "border-border bg-card text-muted-foreground",
                      )}>
                        {done ? <CheckCircle2 className="h-4 w-4" /> : active ? <Clock className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                      </span>
                      <div className="flex-1 rounded-xl border border-border bg-card p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">{m.name}</p>
                          <StatusBadge status={m.status} />
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Due {formatDate(m.dueDate)} • {fmtMoney(m.amount || 0)}
                        </p>
                        {m.description && <p className="mt-2 text-sm text-muted-foreground">{m.description}</p>}
                        {deliverables.length > 0 && (
                          <div className="mt-3">
                            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Deliverables</p>
                            <div className="flex flex-wrap gap-1.5">
                              {deliverables.map((d: any) => (
                                <a
                                  key={d._id}
                                  href={d.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs hover:bg-muted"
                                >
                                  <Paperclip className="h-3 w-3" /> {d.fileName}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        {m.status === 'under_review' && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              onClick={() => approveMutation.mutate(m._id)}
                              disabled={approveMutation.isPending || requestChangesMutation.isPending}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground hover:opacity-90 disabled:opacity-50"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" /> Approve work
                            </button>
                            <button
                              onClick={() => setRequestChangesFor(m)}
                              disabled={approveMutation.isPending || requestChangesMutation.isPending}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
                            >
                              <MessageSquare className="h-3.5 w-3.5" /> Request changes
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })
              )}
            </ol>
          </Card>
        )}

        {tab === "feed" && (
          <Card className="flex h-[600px] flex-col">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {msgs.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">No messages yet.</p>
              ) : (
                msgs.map((m: any) => {
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
          </Card>
        )}

        {tab === "files" && (
          files.length === 0 ? (
            <Card className="p-8 text-center"><p className="text-sm text-muted-foreground">No files shared yet.</p></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {files.map((f: any) => {
                const Icon = (f.fileName || '').endsWith('.pdf') ? FileText : (f.fileName || '').endsWith('.zip') ? Archive : ImageIcon;
                return (
                  <Card key={f._id} className="flex flex-col gap-3 p-4">
                    <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div>
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{f.fileName}</p></div>
                    <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs font-medium hover:bg-muted">
                      <Download className="h-3.5 w-3.5" /> Download
                    </a>
                  </Card>
                );
              })}
            </div>
          )
        )}

        {tab === "invoices" && (
          <div className="space-y-3">
            {invs.length === 0 ? (
              <Card className="p-8 text-center"><p className="text-sm text-muted-foreground">No invoices yet.</p></Card>
            ) : (
              invs.map((i: any) => (
                <Card key={i._id} className="flex flex-wrap items-center gap-4 p-5">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{i.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">Due {i.dueDate ? formatDate(i.dueDate) : '—'}</p>
                  </div>
                  <p className="text-lg font-bold">{fmtMoney(i.total || 0)}</p>
                  <StatusBadge status={i.status} />
                  {i.status !== 'paid' && i.status === 'sent' && (
                    <button onClick={() => toast.info('Payment coming soon')} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                      <CreditCard className="h-4 w-4" /> Pay Now
                    </button>
                  )}
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {requestChangesFor && (
        <RequestChangesModal
          milestone={requestChangesFor}
          loading={requestChangesMutation.isPending}
          onClose={() => setRequestChangesFor(null)}
          onSubmit={(message) => requestChangesMutation.mutate({ milestoneId: requestChangesFor._id, message })}
        />
      )}
    </PortalLayout>
  );
}

function RequestChangesModal({
  milestone,
  loading,
  onClose,
  onSubmit,
}: {
  milestone: any;
  loading: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
}) {
  const [message, setMessage] = useState('');

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Request changes</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{milestone.name}</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Describe what needs to change. Your freelancer will receive this in the project feed.
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="e.g. Please update the color palette and adjust spacing on the homepage mockup..."
          className="mt-3 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
          <button
            disabled={!message.trim() || loading}
            onClick={() => onSubmit(message.trim())}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}
