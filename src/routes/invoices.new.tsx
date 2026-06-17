import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/portal/DashboardLayout";
import { Card } from "@/components/portal/Bits";
import { clients, fmtMoney } from "@/lib/data";

export const Route = createFileRoute("/invoices/new")({
  head: () => ({ meta: [{ title: "New Invoice — Tela" }] }),
  component: NewInvoice,
});

type Line = { id: string; desc: string; qty: number; rate: number };

function NewInvoice() {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [issue, setIssue] = useState("2026-06-17");
  const [due, setDue] = useState("2026-07-01");
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("Payment due within 14 days. Thank you for your business.");
  const [lines, setLines] = useState<Line[]>([
    { id: "1", desc: "Brand strategy workshop", qty: 1, rate: 1500 },
    { id: "2", desc: "Logo concept rounds (3)", qty: 3, rate: 600 },
  ]);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.qty * l.rate, 0), [lines]);
  const total = subtotal + subtotal * (tax / 100) - discount;
  const client = clients.find((c) => c.id === clientId);

  return (
    <DashboardLayout title="New Invoice">
      <Link to="/invoices" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to invoices
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card className="p-6">
          <h3 className="font-semibold">Invoice Details</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Labeled label="Invoice #"><input readOnly value="INV-0048" className={inp + " bg-muted/40"} /></Labeled>
            <Labeled label="Client">
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inp}>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
              </select>
            </Labeled>
            <Labeled label="Issue date"><input type="date" value={issue} onChange={(e) => setIssue(e.target.value)} className={inp} /></Labeled>
            <Labeled label="Due date"><input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={inp} /></Labeled>
          </div>

          <h3 className="mt-6 font-semibold">Line Items</h3>
          <div className="mt-3 space-y-2">
            {lines.map((l, idx) => (
              <div key={l.id} className="grid grid-cols-[1fr_70px_90px_90px_36px] items-center gap-2">
                <input value={l.desc} onChange={(e) => updateLine(idx, { desc: e.target.value })} className={inp} placeholder="Description" />
                <input type="number" min={1} value={l.qty} onChange={(e) => updateLine(idx, { qty: +e.target.value })} className={inp} />
                <input type="number" min={0} value={l.rate} onChange={(e) => updateLine(idx, { rate: +e.target.value })} className={inp} />
                <div className="text-right text-sm font-medium">{fmtMoney(l.qty * l.rate)}</div>
                <button onClick={() => setLines(lines.filter((_, i) => i !== idx))} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
          <button onClick={() => setLines([...lines, { id: Date.now() + "", desc: "", qty: 1, rate: 0 }])} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            <Plus className="h-4 w-4" /> Add Line Item
          </button>

          <div className="mt-6 space-y-3 border-t border-border pt-5">
            <Row label="Subtotal" value={fmtMoney(subtotal)} />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tax (%)</span>
              <input type="number" min={0} value={tax} onChange={(e) => setTax(+e.target.value)} className="h-9 w-24 rounded-lg border border-input bg-background px-2 text-right text-sm" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
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
            <button onClick={() => toast.success("Saved as draft")} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Save as Draft</button>
            <button onClick={() => toast.success(`Invoice sent to ${client?.name}`)} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Send to Client</button>
          </div>
        </Card>

        {/* Preview */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="overflow-hidden">
            <div className="p-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Sparkles className="h-5 w-5" /></div>
                  <div>
                    <p className="font-bold">Tela Studio</p>
                    <p className="text-xs text-muted-foreground">alex@tela.studio</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Invoice</p>
                  <p className="text-lg font-bold">INV-0048</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Bill to</p>
                  <p className="mt-1 font-medium">{client?.name}</p>
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
                  <tr><th className="py-2 text-left font-medium">Item</th><th className="py-2 text-right font-medium">Qty</th><th className="py-2 text-right font-medium">Rate</th><th className="py-2 text-right font-medium">Amount</th></tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id} className="border-b border-border last:border-0">
                      <td className="py-2">{l.desc || <span className="text-muted-foreground italic">—</span>}</td>
                      <td className="py-2 text-right">{l.qty}</td>
                      <td className="py-2 text-right">{fmtMoney(l.rate)}</td>
                      <td className="py-2 text-right">{fmtMoney(l.qty * l.rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-5 space-y-1.5 text-sm">
                <Row label="Subtotal" value={fmtMoney(subtotal)} />
                <Row label={`Tax (${tax}%)`} value={fmtMoney(subtotal * (tax / 100))} />
                <Row label="Discount" value={`-${fmtMoney(discount)}`} />
                <div className="flex justify-between border-t border-border pt-2.5"><span className="font-semibold">Total Due</span><span className="text-xl font-bold">{fmtMoney(total)}</span></div>
              </div>

              <p className="mt-6 text-xs text-muted-foreground">{notes}</p>

              <button className="mt-6 w-full rounded-xl bg-success py-3 text-sm font-semibold text-success-foreground hover:opacity-90">Pay Now</button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }
}

const inp = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary";

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>{children}</label>;
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}