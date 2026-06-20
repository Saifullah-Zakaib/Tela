import { createFileRoute, Outlet } from "@tanstack/react-router";
import { freelancerAppBeforeLoad } from "@/lib/route-guards";

export const Route = createFileRoute("/proposals")({
  beforeLoad: freelancerAppBeforeLoad,
  component: ProposalsLayout,
});

function ProposalsLayout() {
  return <Outlet />;
}
