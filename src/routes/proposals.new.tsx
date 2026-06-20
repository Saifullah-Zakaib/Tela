import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Copy, Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/portal/DashboardLayout";
import { Card } from "@/components/portal/Bits";
import { clientsApi, proposalsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { fmtMoney } from "@/lib/data";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export const Route = createFileRoute("/proposals/new")({
  head: () => ({ meta: [{ title: "New Proposal — Tela" }] }),
  component: NewProposal,
});

function NewProposal() {
  const { user: authUser, isAuthenticated } = useRequireAuth('freelancer');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { freelancer } = useAuth();

  if (!isAuthenticated) {
    return <DashboardLayout title="Loading..."><div>Loading...</div></DashboardLayout>;
  }

  const [f, setF] = useState({
    title: "",
    clientId: "",
    desc: "",
    timeline: "",
    total: 0,
    terms: "",
  });
  const [deliverables, setDeliverables] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [shareLink, setShareLink] = useState("");

  const { data: clientsData, isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll({ limit: 100 } as any),
  });

  const clients = clientsData?.data || [];
  const client = clients.find((c: any) => c._id === f.clientId);

  useEffect(() => {
    if (!f.clientId && clients.length > 0) {
      setF((prev) => ({ ...prev, clientId: clients[0]._id }));
    }
  }, [clients, f.clientId]);

  const studioName = freelancer?.businessName || freelancer?.name || "Your Studio";

  const handleGenerate = async () => {
    if (!f.title.trim()) {
      toast.error("Please enter a project title");
      return;
    }
    if (!f.clientId) {
      toast.error("Please select a client");
      return;
    }

    const items = deliverables.map((d) => d.trim()).filter(Boolean);
    if (items.length === 0) {
      toast.error("Add at least one deliverable");
      return;
    }

    setSaving(true);
    try {
      const res = await proposalsApi.create({
        clientId: f.clientId,
        title: f.title.trim(),
        description: f.desc.trim(),
        deliverables: items,
        timeline: f.timeline.trim(),
        price: f.total,
        paymentTerms: f.terms.trim(),
      });

      const link = res.data.shareableLink
        || `${window.location.origin}/proposals/public/${res.data.publicSlug}`;

      setShareLink(link);
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success("Proposal sent!", { description: `Email sent to ${client?.email}` });
    } catch (err: any) {
      toast.error(err.message || "Failed to create proposal");
    } finally {
      setSaving(false);
    }
  };

  if (loadingClients) {
    return (
      <DashboardLayout title="New Proposal">
        <div className="text-center text-muted-foreground py-12">Loading...</div>
      </DashboardLayout>
    );
  }

  if (clients.length === 0) {
    return (
      <DashboardLayout title="New Proposal">
        <Link to="/proposals" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to proposals
        </Link>
        <Card className="mt-6 p-8 text-center">
          <p className="text-sm text-muted-foreground">Add a client first before creating a proposal.</p>
          <Link to="/clients" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Go to Clients
          </Link>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="New Proposal">
      <Link to="/proposals" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to proposals
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold">Proposal Details</h3>
          <div className="mt-5 space-y-4">
            <Lbl label="Project title">
              <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Brand Identity Refresh" className={inp} />
            </Lbl>
            <Lbl label="Client">
              <select value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })} className={inp}>
                {clients.map((c: any) => (
                  <option key={c._id} value={c._id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>
                ))}
              </select>
            </Lbl>
            <Lbl label="Project description">
              <textarea rows={4} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="Describe the scope of work..." className={inp + " resize-none py-2"} />
            </Lbl>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Deliverables</span>
              <div className="space-y-2">
                {deliverables.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={d}
                      onChange={(e) => setDeliverables(deliverables.map((x, j) => (j === i ? e.target.value : x)))}
                      placeholder="e.g. Logo design concepts"
                      className={inp}
                    />
                    <button
                      type="button"
                      onClick={() => setDeliverables(deliverables.filter((_, j) => j !== i))}
                      disabled={deliverables.length === 1}
                      className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setDeliverables([...deliverables, ""])}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <Plus className="h-4 w-4" /> Add deliverable
                </button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Lbl label="Timeline">
                <input value={f.timeline} onChange={(e) => setF({ ...f, timeline: e.target.value })} placeholder="e.g. 6 weeks" className={inp} />
              </Lbl>
              <Lbl label="Total price (USD)">
                <input type="number" min={0} value={f.total} onChange={(e) => setF({ ...f, total: +e.target.value })} className={inp} />
              </Lbl>
            </div>
            <Lbl label="Payment terms">
              <textarea rows={3} value={f.terms} onChange={(e) => setF({ ...f, terms: e.target.value })} placeholder="e.g. 50% upfront, 50% on delivery" className={inp + " resize-none py-2"} />
            </Lbl>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {!shareLink ? (
              <button
                type="button"
                disabled={saving}
                onClick={handleGenerate}
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Sending to client..." : "Send to Client"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate({ to: "/proposals" })}
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                View proposals
              </button>
            )}
          </div>
        </Card>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-primary to-accent p-8 text-primary-foreground">
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="font-bold">{studioName}</span>
              </div>
              <h2 className="mt-6 text-3xl font-bold">{f.title || "Proposal title"}</h2>
              <p className="mt-1 text-primary-foreground/80">
                Prepared for {client?.name || "Client"}{client?.company ? ` • ${client.company}` : ""}
              </p>
            </div>
            <div className="space-y-6 p-8 text-sm">
              {f.desc && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overview</p>
                  <p className="mt-2 leading-relaxed">{f.desc}</p>
                </div>
              )}
              {deliverables.some((d) => d.trim()) && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deliverables</p>
                  <ul className="mt-2 space-y-1.5">
                    {deliverables.filter((d) => d.trim()).map((d, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-muted/30 p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Timeline</p>
                  <p className="font-semibold">{f.timeline || "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{fmtMoney(f.total)}</p>
                </div>
              </div>
              {f.terms && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment Terms</p>
                  <p className="mt-2 text-muted-foreground">{f.terms}</p>
                </div>
              )}
              {shareLink ? (
                <div className="space-y-3">
                  <div className="flex gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-3">
                    <input readOnly value={shareLink} className="flex-1 bg-transparent text-xs outline-none" />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(shareLink);
                        toast.success("Link copied");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Proposal has been sent to {client?.email}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Generate the proposal to send it to your client via email.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

const inp = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary";

function Lbl({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
