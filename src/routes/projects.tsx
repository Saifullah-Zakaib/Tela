import { createFileRoute, Outlet } from "@tanstack/react-router";
import { freelancerAppBeforeLoad } from "@/lib/route-guards";

export const Route = createFileRoute("/projects")({
  beforeLoad: freelancerAppBeforeLoad,
  component: ProjectsLayout,
});

function ProjectsLayout() {
  return <Outlet />;
}
