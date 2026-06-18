import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, StatusBadge } from "@/components/portal/Bits";
import { projectsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/portal")({
  head: () => ({ meta: [{ title: "My Projects — Client Portal" }] }),
  component: Portal,
});

function Portal() {
  const { user } = useAuth();
  
  const { data, isLoading } = useQuery({
    queryKey: ['client-projects'],
    queryFn: () => projectsApi.getAll(),
    enabled: !!user
  });

  const projects = data?.data || [];
  
  // Filter projects where current user is the client
  const myProjects = projects.filter((p: any) => p.client?._id === user?._id);

  return (
    <PortalLayout title="My Projects">
      <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name?.split(' ')[0] || 'Client'}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Here are your active projects.</p>
      
      {isLoading ? (
        <div className="mt-6 text-center text-muted-foreground">Loading your projects...</div>
      ) : myProjects.length === 0 ? (
        <Card className="mt-6 p-8 text-center">
          <p className="text-sm text-muted-foreground">No projects yet. Your freelancer will add you to projects soon!</p>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {myProjects.map((p: any) => (
            <Link key={p._id} to="/portal/projects/$id" params={{ id: p._id }}>
              <Card className="p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{p.name}</p>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Due {p.deadline ? new Date(p.deadline).toLocaleDateString() : 'No deadline'}
                </p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${p.progress || 0}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{p.progress || 0}% complete</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}