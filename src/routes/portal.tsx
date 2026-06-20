import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { clientPortalBeforeLoad } from "@/lib/route-guards";

export const Route = createFileRoute("/portal")({
  beforeLoad: clientPortalBeforeLoad,
  component: PortalLayout,
});

function PortalLayout() {
  return <Outlet />;
}
