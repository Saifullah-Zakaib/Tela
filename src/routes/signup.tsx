import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell, Field, inputCls } from "@/components/portal/AuthShell";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { signupBeforeLoad } from "@/lib/route-guards";

export const Route = createFileRoute("/signup")({
  beforeLoad: signupBeforeLoad,
  head: () => ({ meta: [{ title: "Sign up — Tela" }] }),
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const { register } = useAuth();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({ name: "", email: "", pwd: "", confirm: "", role: "freelancer" });
  const [err, setErr] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n: Record<string, string> = {};
    if (f.name.trim().length < 2) n.name = "Tell us your name";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) n.email = "Enter a valid email";
    if (f.pwd.length < 6) n.pwd = "Use at least 6 characters";
    if (f.confirm !== f.pwd) n.confirm = "Passwords don't match";
    setErr(n);
    if (Object.keys(n).length) return;
    
    setLoading(true);
    try {
      await register(f.name, f.email, f.pwd);
      toast.success("Account created. Choose a plan to get started.");
      nav({ to: "/pricing" });
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
      if (error.message.toLowerCase().includes("exists")) {
        setErr({ email: "Email already exists" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start your 14-day Pro trial. No credit card required."
      footer={<>Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" error={err.name}>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} placeholder="Alex Carter" />
        </Field>
        <Field label="Work email" error={err.email}>
          <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={inputCls} placeholder="alex@studio.com" />
        </Field>
        <Field label="Password" error={err.pwd}>
          <div className="relative">
            <input type={show ? "text" : "password"} value={f.pwd} onChange={(e) => setF({ ...f, pwd: e.target.value })} className={inputCls + " pr-10"} placeholder="At least 8 characters" />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Field label="Confirm password" error={err.confirm}>
          <input type={show ? "text" : "password"} value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} className={inputCls} />
        </Field>
        <div>
          <span className="mb-1.5 block text-sm font-medium">I am a…</span>
          <div className="grid grid-cols-2 gap-2">
            {["freelancer", "agency"].map((r) => (
              <button type="button" key={r} onClick={() => setF({ ...f, role: r })} className={cn("rounded-xl border px-3 py-2.5 text-sm font-medium capitalize transition", f.role === r ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted")}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}