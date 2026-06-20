import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell, Field, inputCls } from "@/components/portal/AuthShell";
import { useAuth } from "@/lib/auth-context";
import { loginBeforeLoad } from "@/lib/route-guards";
import { hasActiveSubscription } from "@/lib/subscription";

export const Route = createFileRoute("/login")({
  beforeLoad: loginBeforeLoad,
  head: () => ({ meta: [{ title: "Login — Tela" }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<{ email?: string; pwd?: string }>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof err = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) next.email = "Enter a valid email";
    if (pwd.length < 6) next.pwd = "Password must be at least 6 characters";
    setErr(next);
    if (Object.keys(next).length) return;
    
    setLoading(true);
    try {
      const user = await login(email, pwd);
      toast.success("Welcome back!");

      if (user.role === 'client') {
        nav({ to: "/portal" });
      } else if (!hasActiveSubscription(user)) {
        nav({ to: "/pricing" });
      } else {
        nav({ to: "/dashboard" });
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials");
      setErr({ pwd: "Invalid email or password" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your Tela workspace."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">Create one</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" error={err.email}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.com" className={inputCls} />
        </Field>
        <Field label="Password" error={err.pwd}>
          <div className="relative">
            <input type={show ? "text" : "password"} value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="••••••••" className={inputCls + " pr-10"} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 rounded border-input" />
            <span className="text-muted-foreground">Remember me</span>
          </label>
          <a href="#" className="font-medium text-primary hover:underline">Forgot password?</a>
        </div>
        <button type="submit" disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}