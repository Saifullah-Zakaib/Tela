import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Eye, Send, Download } from "lucide-react";
import { DashboardLayout } from "@/components/portal/DashboardLayout";
import { Card, StatusBadge } from "@/components/portal/Bits";
import { invoices, clientById, fmtMoney } from "@/lib/data";

export const Route = createFileRoute("/invoices")({
  head: () => ({ meta: [{ title: "Invoices — Tela" }] }),
  component: Invoices,
});

function Invoices() {
  const total = invoices.reduce((s, i) => s + i.amount, 0);
  const paid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);

  return (
    <DashboardLayout title="Invoices">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
          <p className="mt-1 text-sm text-muted-foreground">Track every dollar in and out of your studio.</p>
        </div>
        <Link to="/invoices/new" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> New Invoice
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { l: "Total invoiced", v: fmtMoney(total), t: "bg-primary/10 text-primary" },
          { l: "Paid", v: fmtMoney(paid), t: "bg-success/10 text-success" },
          { l: "Overdue", v: fmtMoney(overdue), t: "bg-destructive/10 text-destructive" },
        ].map((s) => (
          <Card key={s.l} className="p-5">
            <p className="text-sm text-muted-foreground">{s.l}</p>
            <p className="mt-1.5 text-2xl font-bold">{s.v}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Invoice</th>
                <th className="px-5 py-3 text-left font-medium">Client</th>
                <th className="px-5 py-3 text-left font-medium">Issued</th>
                <th className="px-5 py-3 text-left font-medium">Due</th>
                <th className="px-5 py-3 text-left font-medium">Amount</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium">{i.id}</td>
                  <td className="px-5 py-3 text-muted-foreground">{clientById(i.clientId)?.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{i.issued}</td>
                  <td className="px-5 py-3 text-muted-foreground">{i.due}</td>
                  <td className="px-5 py-3 font-semibold">{fmtMoney(i.amount)}</td>
                  <td className="px-5 py-3"><StatusBadge status={i.status} /></td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button title="View" className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-muted"><Eye className="h-3.5 w-3.5" /></button>
                      <button title="Send" className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-muted"><Send className="h-3.5 w-3.5" /></button>
                      <button title="Download" className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-muted"><Download className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}