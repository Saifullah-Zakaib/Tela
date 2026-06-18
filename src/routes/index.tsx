import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  FileText,
  MessageSquare,
  Sparkles,
  Moon,
  Sun,
  Receipt,
  Clock,
  TrendingUp,
  Layers,
  Star,
} from "lucide-react";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tela — Freelancer Client Portal" },
      { name: "description", content: "Manage clients, get paid, and stay professional. The all-in-one workspace for independent designers, developers, and writers." },
      { property: "og:title", content: "Tela — Freelancer Client Portal" },
      { property: "og:description", content: "Manage clients, get paid, and stay professional." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/30">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-8 px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Tela</span>
            <span className="ml-1 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Beta</span>
          </Link>
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#product" className="transition hover:text-foreground">Product</a>
            <a href="#workflow" className="transition hover:text-foreground">Workflow</a>
            <a href="#customers" className="transition hover:text-foreground">Customers</a>
            <a href="#pricing" className="transition hover:text-foreground">Pricing</a>
            <a href="#changelog" className="transition hover:text-foreground">Changelog</a>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/login" className="hidden rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground md:inline">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background transition hover:opacity-90"
            >
              Start free <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero (asymmetric, editorial) ────────────────────── */}
      <section className="relative border-b border-border">
        <div className="pointer-events-none absolute right-0 top-0 h-[520px] w-[520px] -translate-y-1/3 translate-x-1/3 rounded-full bg-primary/20 blur-[140px]" />
        <div className="relative mx-auto grid max-w-7xl gap-16 px-6 py-20 md:grid-cols-12 md:py-28">
          <div className="md:col-span-7">
            <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-px w-8 bg-foreground/40" />
              Workspace for independent operators
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">
              The quiet
              <br />
              <span className="italic text-primary">back office</span>
              <br />
              behind your studio.
            </h1>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Tela is one workspace for the unglamorous half of freelance work — proposals, scope, invoices,
              approvals, and a client portal that doesn't look like a spreadsheet from 2014.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
              >
                Start free trial <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium transition hover:bg-muted"
              >
                Open live demo
              </Link>
              <span className="text-xs text-muted-foreground">No card · 14 days Pro</span>
            </div>
          </div>

          {/* Right rail — live data card */}
          <aside className="md:col-span-5">
            <div className="rounded-xl border border-border bg-card/60 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_30px_60px_-30px_rgba(0,0,0,0.3)] backdrop-blur">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                  Live · Studio overview
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Jun 2026</span>
              </div>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border">
                {[
                  { l: "Revenue", v: "$24,800", d: "+18%", icon: TrendingUp },
                  { l: "Outstanding", v: "$12,400", d: "3 invoices", icon: Receipt },
                  { l: "Active projects", v: "8", d: "2 in review", icon: Layers },
                  { l: "Avg pay time", v: "4.2d", d: "−1.1d", icon: Clock },
                ].map((s) => (
                  <div key={s.l} className="bg-card p-4">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{s.l}</span>
                      <s.icon className="h-3.5 w-3.5" />
                    </div>
                    <p className="mt-2 text-xl font-semibold tracking-tight">{s.v}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{s.d}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { c: "Northwind Co.", a: "$4,200", s: "Paid", t: "success" },
                  { c: "Lumen Health", a: "$6,800", s: "Sent", t: "warning" },
                  { c: "Forge Studio", a: "$1,400", s: "Draft", t: "muted" },
                ].map((r) => (
                  <div key={r.c} className="flex items-center justify-between rounded-md border border-border bg-background/60 px-3 py-2 text-xs">
                    <span className="font-medium">{r.c}</span>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="tabular-nums">{r.a}</span>
                      <span
                        className={
                          r.t === "success"
                            ? "rounded bg-success/15 px-1.5 py-0.5 text-success"
                            : r.t === "warning"
                            ? "rounded bg-warning/15 px-1.5 py-0.5 text-warning"
                            : "rounded bg-muted px-1.5 py-0.5"
                        }
                      >
                        {r.s}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Logo strip */}
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-12 gap-y-4 px-6 py-6 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span>Trusted by independents at</span>
            {["Northwind", "Lumen", "Forge", "Halcyon", "Atelier 9", "Parsec"].map((b) => (
              <span key={b} className="font-medium text-foreground/70">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product / bento ─────────────────────────────────── */}
      <section id="product" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid items-end gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">01 — The product</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
                Five tools you were duct-taping together. One workspace.
              </h2>
            </div>
            <p className="text-sm text-muted-foreground md:col-span-5">
              Tela replaces the messy Notion + Stripe + Google Drive + email + spreadsheet stack with
              a single, opinionated surface designed around how freelance work actually moves.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-12 gap-4">
            {/* Big card */}
            <div className="col-span-12 row-span-2 overflow-hidden rounded-xl border border-border bg-card p-7 md:col-span-7">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" /> Projects
              </div>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight">A kanban that respects your scope.</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Milestones, files, change requests, and approvals — wired to the invoice so nothing ships unpaid.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {["Backlog", "In progress", "In review"].map((c, i) => (
                  <div key={c} className="rounded-lg border border-border bg-background p-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{c}</p>
                    <div className="mt-3 space-y-2">
                      {[...Array(i === 1 ? 3 : 2)].map((_, j) => (
                        <div key={j} className="rounded-md border border-border bg-card p-2">
                          <div className="h-1.5 w-2/3 rounded bg-muted" />
                          <div className="mt-2 flex items-center justify-between">
                            <div className="h-1 w-10 rounded bg-muted" />
                            <div className="h-4 w-4 rounded-full bg-primary/40" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-12 rounded-xl border border-border bg-card p-7 md:col-span-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" /> Invoicing
              </div>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight">Branded invoices. Boring follow-ups, automated.</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Send a polished invoice, accept card or ACH, and let Tela handle the awkward reminders.
              </p>
              <div className="mt-6 rounded-lg border border-border bg-background p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">INV-0241</span>
                  <span className="text-lg font-semibold tabular-nums">$4,200.00</span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-3/4 rounded-full bg-primary" />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">3 of 4 milestones billed</p>
              </div>
            </div>

            <div className="col-span-12 rounded-xl border border-border bg-card p-7 md:col-span-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" /> Client portal
              </div>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight">One link. No more "did you get my email?"</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Clients sign in to a branded portal to approve work, leave notes, and pay — without learning a new tool.
              </p>
            </div>

            <div className="col-span-12 rounded-xl border border-border bg-card p-7 md:col-span-7">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" /> Proposals
              </div>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight">Proposals that convert, written in minutes.</h3>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                Reusable blocks, signature on send, and a hand-off straight into a live project the moment a client accepts.
              </p>
              <div className="mt-6 grid grid-cols-4 gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                {["Cover", "Scope", "Pricing", "Sign"].map((s, i) => (
                  <div
                    key={s}
                    className={`rounded-md border px-2 py-3 text-center ${
                      i === 3 ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"
                    }`}
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Workflow ────────────────────────────────────────── */}
      <section id="workflow" className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">02 — How it flows</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight md:text-5xl">
            From cold lead to paid invoice, in a single thread.
          </h2>

          <ol className="mt-16 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
            {[
              { n: "01", t: "Send proposal", d: "Pick a template, customize scope, e-sign on accept." },
              { n: "02", t: "Spin up project", d: "Milestones, kanban, files — pre-wired from the proposal." },
              { n: "03", t: "Share the portal", d: "Client logs in, approves work, leaves notes. No email chains." },
              { n: "04", t: "Get paid", d: "Auto-invoice on milestone, card or ACH, auto-reminders." },
            ].map((s) => (
              <li key={s.n} className="bg-background p-6">
                <div className="font-mono text-xs text-muted-foreground">{s.n}</div>
                <p className="mt-6 text-base font-semibold tracking-tight">{s.t}</p>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Customers / testimonial ─────────────────────────── */}
      <section id="customers" className="border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 py-24 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">03 — Customers</p>
            <div className="mt-10 grid grid-cols-3 gap-6 border-y border-border py-8">
              {[
                { v: "12k+", l: "freelancers" },
                { v: "$48M", l: "invoiced" },
                { v: "4.2d", l: "avg pay time" },
              ].map((s) => (
                <div key={s.l}>
                  <p className="text-3xl font-semibold tracking-tight">{s.v}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex gap-1 text-warning">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              <span className="ml-2 text-xs text-muted-foreground">4.9 · 320 reviews</span>
            </div>
          </div>

          <figure className="md:col-span-7">
            <blockquote className="text-2xl font-medium leading-snug tracking-tight md:text-3xl">
              <span className="text-muted-foreground">"</span>
              Tela replaced four tools and shaved a full day a week off my admin. The portal is the
              thing my clients keep noticing — it just looks{" "}
              <span className="italic text-primary">considered</span>.
              <span className="text-muted-foreground">"</span>
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-3 border-t border-border pt-6">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-foreground text-xs font-semibold text-background">
                MC
              </div>
              <div>
                <p className="text-sm font-semibold">Maya Chen</p>
                <p className="text-xs text-muted-foreground">Brand designer · Northwind Studio</p>
              </div>
              <a href="#" className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                Read case study <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </figcaption>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {[
                { n: "Daniel Okafor", r: "Full-stack dev", t: "Invoices go out in a click and reminders just work. I stopped chasing payments." },
                { n: "Lena Petrov", r: "Copywriter", t: "No more endless email threads about what's approved. The portal is the source of truth." },
              ].map((t) => (
                <div key={t.n} className="rounded-lg border border-border bg-card p-5">
                  <p className="text-sm leading-relaxed">{t.t}</p>
                  <p className="mt-4 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{t.n}</span> · {t.r}
                  </p>
                </div>
              ))}
            </div>
          </figure>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section id="pricing" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid items-end gap-10 md:grid-cols-12">
            <div className="md:col-span-8">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">04 — Get started</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
                Set up your first client<br />in under sixty seconds.
              </h2>
            </div>
            <div className="flex flex-col gap-3 md:col-span-4 md:items-end">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:opacity-90"
              >
                Start free trial <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-xs text-muted-foreground">14 days Pro · no card · cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer>
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-12">
          <div className="md:col-span-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold">Tela</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The quiet back office behind independent studios.
            </p>
          </div>
          {[
            { h: "Product", l: ["Overview", "Pricing", "Changelog", "Roadmap"] },
            { h: "Company", l: ["About", "Customers", "Careers", "Contact"] },
            { h: "Resources", l: ["Templates", "Guides", "Support", "Status"] },
            { h: "Legal", l: ["Privacy", "Terms", "Security", "DPA"] },
          ].map((g) => (
            <div key={g.h} className="md:col-span-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{g.h}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {g.l.map((x) => (
                  <li key={x}><a href="#" className="text-foreground/80 transition hover:text-foreground">{x}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-muted-foreground md:flex-row">
            <p>© 2026 Tela Studio. All rights reserved.</p>
            <p>Made for independents, everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
