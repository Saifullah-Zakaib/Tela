import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell, Field, inputCls } from "@/components/portal/AuthShell";

export const Route = createFileRoute("/client-setup")({
  head: () => ({ meta: [{ title: "Set your password — Tela" }] }),
  component: ClientSetup,
});

function ClientSetup() {
  const nav = useNavigate();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n: Record<string, string> = {};
    if (pwd.length < 8) n.pwd = "Use at least 8 characters";
    if (confirm !== pwd) n.confirm = "Passwords don't match";
    setErr(n);
    if (Object.keys(n).length) return;
    setLoading(true);
    setTimeout(() => {
      toast.success("Password set. Welcome!");
      nav({ to: "/portal" });
    }, 700);
  }

  return (
    <AuthShell title="Set your password" subtitle="You've been invited by Alex Carter to view your projects on Tela.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="New password" error={err.pwd}>
          <div className="relative">
            <input type={show ? "text" : "password"} value={pwd} onChange={(e) => setPwd(e.target.value)} className={inputCls + " pr-10"} placeholder="At least 8 characters" />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Field label="Confirm password" error={err.confirm}>
          <input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
        </Field>
        <button type="submit" disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Setting password…" : "Set password & continue"}
        </button>
      </form>
    </AuthShell>
  );
}