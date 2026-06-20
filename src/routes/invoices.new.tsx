import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/portal/DashboardLayout";
import { Card, StatusBadge } from "@/components/portal/Bits";
import { clientsApi, projectsApi, invoicesApi, milestonesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { fmtMoney } from "@/lib/data";
import { cn, isPastDateInput, minDateInputValue } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export const Route = createFileRoute("/invoices/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    project: typeof search.project === "string" ? search.project : undefined,
    milestone: typeof search.milestone === "string" ? search.milestone : undefined,
    client: typeof search.client === "string" ? search.client : undefined,
  }),
  head: () => ({ meta: [{ title: "New Invoice — Tela" }] }),
  component: NewInvoice,
});

type Line = { id: string; desc: string; qty: number; rate: number; milestoneId?: string };

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function NewInvoice() {
  const { user: authUser, isAuthenticated } = useRequireAuth('freelancer');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { freelancer } = useAuth();
  const search = Route.useSearch();

  if (!isAuthenticated) {
    return <DashboardLayout title="Loading..."><div>Loading...</div></DashboardLayout>;
  }

  const [clientId, setClientId] = useState(search.client || "");
  const [projectId, setProjectId] = useState(search.project || "");
  const [selectedMilestoneIds, setSelectedMilestoneIds] = useState<string[]>(
    search.milestone ? [search.milestone] : [],
  );
  const [extraLines, setExtraLines] = useState<Line[]>([]);
  const [rateOverrides, setRateOverrides] = useState<Record<string, number>>({});
  const [issue, setIssue] = useState(today());
  const [due, setDue] = useState(defaultDueDate());
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("Payment due within 14 days. Thank you for your business.");
  const [saving, setSaving] = useState(false);
  const [previewNumber, setPreviewNumber] = useState("Auto-assigned");

  const autoSelectedRef = useRef(false);
  const prevClientRef = useRef(clientId);

  const { data: clientsData, isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll({ limit: 100 } as any),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll({ limit: 100 } as any),
  });

  const { data: milestonesData } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => milestonesApi.getAll(projectId),
    enabled: !!projectId,
  });

  const { data: projectInvoicesData } = useQuery({
    queryKey: ['invoices', projectId],
    queryFn: () => invoicesApi.getAll({ project: projectId, limit: 100 } as any),
    enabled: !!projectId,
  });

  const clients = clientsData?.data || [];
  const milestones = milestonesData?.data || [];

  const clientProjects = useMemo(() => {
    if (!clientId) return [];
    return (projectsData?.data || []).filter(
      (p: any) => (p.client?._id || p.client)?.toString() === clientId,
    );
  }, [projectsData, clientId]);

  const selectedProject = useMemo(() => {
    return (projectsData?.data || []).find((p: any) => p._id === projectId);
  }, [projectsData, projectId]);

  const invoicedMilestoneIds = useMemo(() => {
    const ids = new Set<string>();
    (projectInvoicesData?.data || []).forEach((inv: any) => {
      if (inv.milestone) ids.add((inv.milestone._id || inv.milestone).toString());
      (inv.milestones || []).forEach((m: any) => ids.add((m._id || m).toString()));
    });
    return ids;
  }, [projectInvoicesData]);

  const milestoneLines = useMemo(
    () =>
      milestones
        .filter((m: any) => selectedMilestoneIds.includes(m._id))
        .map((m: any) => ({
          id: m._id,
          desc: m.name,
          qty: 1,
          rate: rateOverrides[m._id] ?? (m.amount ?? 0),
          milestoneId: m._id,
        })),
    [milestones, selectedMilestoneIds, rateOverrides],
  );

  const lines: Line[] = useMemo(() => {
    if (milestoneLines.length > 0) return [...milestoneLines, ...extraLines];
    if (extraLines.length > 0) return extraLines;
    return [{ id: "new-1", desc: "", qty: 1, rate: 0 }];
  }, [milestoneLines, extraLines]);

  useEffect(() => {
    if (!clientId && clients.length > 0) {
      setClientId(search.client || clients[0]._id);
    }
  }, [clients, clientId, search.client]);

  useEffect(() => {
    if (prevClientRef.current && prevClientRef.current !== clientId) {
      setProjectId("");
      setSelectedMilestoneIds([]);
      setExtraLines([]);
      autoSelectedRef.current = false;
    }
    prevClientRef.current = clientId;
  }, [clientId]);

  useEffect(() => {
    autoSelectedRef.current = false;
    setSelectedMilestoneIds(search.milestone ? [search.milestone] : []);
    setExtraLines([]);
  }, [projectId, search.milestone]);

  useEffect(() => {
    if (!projectId || milestones.length === 0 || autoSelectedRef.current) return;

    if (search.milestone && milestones.some((m: any) => m._id === search.milestone)) {
      setSelectedMilestoneIds([search.milestone]);
      autoSelectedRef.current = true;
      return;
    }

    const billable = milestones.filter(
      (m: any) => m.status === "approved" && !invoicedMilestoneIds.has(m._id),
    );
    if (billable.length > 0) {
      setSelectedMilestoneIds(billable.map((m: any) => m._id));
      autoSelectedRef.current = true;
    }
  }, [projectId, milestones, invoicedMilestoneIds, search.milestone]);

  useEffect(() => {
    if (projectId && selectedProject?.client) {
      const pid = (selectedProject.client._id || selectedProject.client).toString();
      if (pid !== clientId) setClientId(pid);
    }
  }, [projectId, selectedProject, clientId]);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.qty * l.rate, 0), [lines]);
  const taxAmount = subtotal * (tax / 100);
  const total = subtotal + taxAmount - discount;
  const client = clients.find((c: any) => c._id === clientId);
  const milestonesTotal = milestones.reduce((s: number, m: any) => s + (m.amount || 0), 0);

  const buildPayload = () => {
    const lineItems = lines
      .filter((l) => l.desc.trim())
      .map((l) => ({
        description: l.desc.trim(),
        quantity: l.qty,
        rate: l.rate,
      }));

    const milestoneIds = lines.filter((l) => l.milestoneId).map((l) => l.milestoneId!);

    if (!clientId) throw new Error("Please select a client");
    if (lineItems.length === 0) throw new Error("Add at least one line item with a description");
    if (due && isPastDateInput(due)) throw new Error("Due date cannot be in the past");

    return {
      clientId,
      projectId: projectId || undefined,
      milestoneIds,
      milestoneId: milestoneIds.length === 1 ? milestoneIds[0] : undefined,
      lineItems,
      taxPercent: tax,
      discount,
      notes,
      dueDate: due ? new Date(due).toISOString() : undefined,
    };
  };

  const handleSave = async (sendAfter = false) => {
    try {
      setSaving(true);
      const payload = buildPayload();
      const res = await invoicesApi.create(payload);
      const invoice = res.data;
      setPreviewNumber(invoice.invoiceNumber);

      if (sendAfter) {
        await invoicesApi.send(invoice._id);
        toast.success(`Invoice sent to ${client?.name}`);
      } else {
        toast.success("Invoice saved as draft");
      }

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      if (projectId) queryClient.invalidateQueries({ queryKey: ['invoices', projectId] });
      navigate({ to: "/invoices" });
    } catch (err: any) {
      toast.error(err.message || "Failed to save invoice");
    } finally {
      setSaving(false);
    }
  };

  const toggleMilestone = (id: string) => {
    setSelectedMilestoneIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const updateLine = (line: Line, patch: Partial<Line>) => {
    if (line.milestoneId) {
      if (patch.rate !== undefined) {
        setRateOverrides((prev) => ({ ...prev, [line.milestoneId!]: patch.rate! }));
      }
      return;
    }
    setExtraLines((prev) => {
      const base = prev.length ? prev : lines.filter((l) => !l.milestoneId);
      return base.map((l) => (l.id === line.id ? { ...l, ...patch } : l));
    });
  };

  const removeLine = (line: Line) => {
    if (line.milestoneId) {
      setSelectedMilestoneIds((prev) => prev.filter((id) => id !== line.milestoneId));
      return;
    }
    setExtraLines((prev) => {
      const base = prev.length ? prev : lines.filter((l) => !l.milestoneId);
      return base.filter((l) => l.id !== line.id);
    });
  };

  const studioName = freelancer?.businessName || freelancer?.name || "Your Studio";
  const studioEmail = freelancer?.email || "";

  if (loadingClients) {
    return (
      <DashboardLayout title="New Invoice">
        <div className="py-12 text-center text-muted-foreground">Loading...</div>
      </DashboardLayout>
    );
  }

  if (clients.length === 0) {
    return (
      <DashboardLayout title="New Invoice">
        <Link to="/invoices" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to invoices
        </Link>
        <Card className="mt-6 p-8 text-center">
          <p className="text-sm text-muted-foreground">Add a client first before creating an invoice.</p>
          <Link to="/clients" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Go to Clients
          </Link>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="New Invoice">
      <Link to="/invoices" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to invoices
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold">Invoice Details</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Labeled label="Invoice #">
              <input readOnly value={previewNumber} className={inp + " bg-muted/40"} />
            </Labeled>
            <Labeled label="Client">
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inp}>
                {clients.map((c: any) => (
                  <option key={c._id} value={c._id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>
                ))}
              </select>
            </Labeled>
            <Labeled label="Project">
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inp}>
                <option value="">No project — manual invoice</option>
                {clientProjects.map((p: any) => (
                  <option key={p._id} value={p._id}>{p.name} ({fmtMoney(p.budget || 0)})</option>
                ))}
              </select>
            </Labeled>
            <Labeled label="Issue date">
              <input type="date" value={issue} onChange={(e) => setIssue(e.target.value)} className={inp} />
            </Labeled>
            <Labeled label="Due date">
              <input type="date" min={minDateInputValue()} value={due} onChange={(e) => setDue(e.target.value)} className={inp} />
            </Labeled>
          </div>

          {selectedProject && (
            <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Project budget:</span> {fmtMoney(selectedProject.budget || 0)}
                {" • "}
                <span className="font-medium text-foreground">All milestones:</span> {fmtMoney(milestonesTotal)}
                {" • "}
                <span className="font-medium text-foreground">Selected:</span> {fmtMoney(milestoneLines.reduce((s, l) => s + l.rate, 0))}
              </p>
            </div>
          )}

          {projectId && milestones.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold">Billable milestones</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Select milestones to add their payment amounts as line items.</p>
              <div className="mt-2 space-y-2">
                {milestones.map((m: any) => {
                  const invoiced = invoicedMilestoneIds.has(m._id);
                  const selected = selectedMilestoneIds.includes(m._id);
                  return (
                    <label
                      key={m._id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition",
                        invoiced ? "cursor-not-allowed border-border bg-muted/20 opacity-60" :
                        selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={invoiced}
                        onChange={() => toggleMilestone(m._id)}
                        className="h-4 w-4 rounded border-input"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{fmtMoney(m.amount || 0)}</p>
                      </div>
                      {invoiced ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Invoiced</span>
                      ) : (
                        <StatusBadge status={m.status} />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <h3 className="mt-6 font-semibold">Line Items</h3>
          <div className="mt-3 space-y-2">
            {lines.map((l, idx) => (
              <div key={l.id} className="grid grid-cols-[1fr_70px_90px_90px_36px] items-center gap-2">
                <input
                  value={l.desc}
                  readOnly={!!l.milestoneId}
                  onChange={(e) => updateLine(l, { desc: e.target.value })}
                  className={cn(inp, l.milestoneId && "bg-muted/40")}
                  placeholder="Description"
                />
                <input
                  type="number"
                  min={1}
                  value={l.qty}
                  readOnly={!!l.milestoneId}
                  onChange={(e) => updateLine(l, { qty: +e.target.value })}
                  className={cn(inp, l.milestoneId && "bg-muted/40")}
                />
                <input
                  type="number"
                  min={0}
                  value={l.rate}
                  onChange={(e) => updateLine(l, { rate: +e.target.value })}
                  className={inp}
                />
                <div className="text-right text-sm font-medium">{fmtMoney(l.qty * l.rate)}</div>
                <button
                  type="button"
                  onClick={() => removeLine(l)}
                  disabled={!l.milestoneId && lines.length === 1}
                  className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setExtraLines((prev) => [...prev, { id: `extra-${Date.now()}`, desc: "", qty: 1, rate: 0 }])}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Plus className="h-4 w-4" /> Add extra line item
          </button>

          <div className="mt-6 space-y-3 border-t border-border pt-5">
            <Row label="Subtotal" value={fmtMoney(subtotal)} />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tax (%)</span>
              <input type="number" min={0} value={tax} onChange={(e) => setTax(+e.target.value)} className="h-9 w-24 rounded-lg border border-input bg-background px-2 text-right text-sm" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Discount ($)</span>
              <input type="number" min={0} value={discount} onChange={(e) => setDiscount(+e.target.value)} className="h-9 w-24 rounded-lg border border-input bg-background px-2 text-right text-sm" />
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-bold">{fmtMoney(total)}</span>
            </div>
          </div>

          <div className="mt-5">
            <span className="mb-1.5 block text-sm font-medium">Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inp + " resize-none py-2"} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(false)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save as Draft"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(true)}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Sending..." : "Send to Client"}
            </button>
          </div>
        </Card>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="overflow-hidden">
            <div className="p-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">{studioName}</p>
                    <p className="text-xs text-muted-foreground">{studioEmail}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Invoice</p>
                  <p className="text-lg font-bold">{previewNumber}</p>
                </div>
              </div>

              {selectedProject && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Project: <span className="font-medium text-foreground">{selectedProject.name}</span>
                </p>
              )}

              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Bill to</p>
                  <p className="mt-1 font-medium">{client?.name || "—"}</p>
                  <p className="text-muted-foreground">{client?.company}</p>
                  <p className="text-xs text-muted-foreground">{client?.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-muted-foreground">Issue / Due</p>
                  <p className="mt-1 text-sm">{issue}</p>
                  <p className="text-sm text-muted-foreground">Due {due}</p>
                </div>
              </div>

              <table className="mt-8 w-full text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 text-left font-medium">Item</th>
                    <th className="py-2 text-right font-medium">Qty</th>
                    <th className="py-2 text-right font-medium">Rate</th>
                    <th className="py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.filter((l) => l.desc.trim()).map((l) => (
                    <tr key={l.id} className="border-b border-border last:border-0">
                      <td className="py-2">{l.desc}</td>
                      <td className="py-2 text-right">{l.qty}</td>
                      <td className="py-2 text-right">{fmtMoney(l.rate)}</td>
                      <td className="py-2 text-right">{fmtMoney(l.qty * l.rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-5 space-y-1.5 text-sm">
                <Row label="Subtotal" value={fmtMoney(subtotal)} />
                <Row label={`Tax (${tax}%)`} value={fmtMoney(taxAmount)} />
                <Row label="Discount" value={`-${fmtMoney(discount)}`} />
                <div className="flex justify-between border-t border-border pt-2.5">
                  <span className="font-semibold">Total Due</span>
                  <span className="text-xl font-bold">{fmtMoney(total)}</span>
                </div>
              </div>

              {notes && <p className="mt-6 text-xs text-muted-foreground">{notes}</p>}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

const inp = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary";

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
