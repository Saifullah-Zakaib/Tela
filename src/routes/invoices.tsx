import { createFileRoute, Outlet } from "@tanstack/react-router";
import { freelancerAppBeforeLoad } from "@/lib/route-guards";

export const Route = createFileRoute("/invoices")({
  beforeLoad: freelancerAppBeforeLoad,
  component: InvoicesLayout,
});

function InvoicesLayout() {
  return <Outlet />;
}
