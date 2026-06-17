import type { Status } from "@/lib/data";
import { STATUS_LABEL } from "@/lib/data";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const styles: Record<Status, string> = {
    planning: "bg-muted text-muted-foreground",
    in_progress: "bg-primary/10 text-primary",
    under_review: "bg-warning/15 text-warning",
    completed: "bg-success/15 text-success",
    pending: "bg-muted text-muted-foreground",
    approved: "bg-success/15 text-success",
    paid: "bg-success/15 text-success",
    overdue: "bg-destructive/15 text-destructive",
    draft: "bg-muted text-muted-foreground",
    sent: "bg-primary/10 text-primary",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const init = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  // Deterministic hue
  const hue = Array.from(name).reduce((s, c) => s + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className={cn(
        "grid place-items-center rounded-full text-xs font-semibold text-white shrink-0",
        className ?? "h-9 w-9",
      )}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 65% 55%), hsl(${(hue + 40) % 360} 70% 45%))` }}
    >
      {init}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-sm transition hover:shadow-md",
        className,
      )}
    >
      {children}
    </div>
  );
}