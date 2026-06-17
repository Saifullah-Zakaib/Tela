import { Link } from "@tanstack/react-router";
import { Moon, Sparkles, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar } from "./Bits";
import { useTheme } from "@/lib/theme";

export function PortalLayout({ children, title }: { children: ReactNode; title?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 md:px-6">
          <Link to="/portal" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="h-4 w-4" /></div>
            <span className="font-bold">Tela Studio</span>
          </Link>
          {title && <span className="hidden text-sm text-muted-foreground sm:inline">/ {title}</span>}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggle} className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:bg-muted">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Avatar name="Ahmed Hassan" className="h-9 w-9" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">{children}</main>
    </div>
  );
}