import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase, FileText, MessageSquare, Sparkles, Check, Moon, Sun } from "lucide-react";
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
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">Tela</span>
          </Link>
          <nav className="ml-10 hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#testimonials" className="hover:text-foreground">Testimonials</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggle} className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:bg-muted">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/login" className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted">Login</Link>
            <Link to="/signup" className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-32 mx-auto h-[480px] max-w-5xl bg-gradient-to-br from-primary/30 via-accent/20 to-transparent opacity-50 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center md:px-6 md:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> Now in public beta
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
            Manage Clients. <span className="text-primary">Get Paid.</span> Stay Professional.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            The all-in-one workspace for independent designers, developers, and writers. Track projects, send branded invoices, and give clients a portal they'll actually love.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:opacity-90"
            >
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold transition hover:bg-muted"
            >
              View Demo
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">No credit card required • 14-day Pro trial</p>
        </div>

        {/* Hero preview */}
        <div className="mx-auto -mt-6 mb-20 max-w-5xl px-4 md:px-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10">
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-4">
              {[
                { l: "Active Projects", v: "8", c: "primary" },
                { l: "Pending Invoices", v: "$12,400", c: "warning" },
                { l: "Revenue (Jun)", v: "$24,800", c: "success" },
                { l: "Clients", v: "23", c: "accent" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs text-muted-foreground">{s.l}</p>
                  <p className="mt-2 text-2xl font-bold">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Everything you need to run your solo business</h2>
          <p className="mt-3 text-muted-foreground">Three pillars, zero busywork.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: Briefcase, title: "Project Management", body: "Milestones, files, and a kanban board that mirrors how you actually work.", c: "primary" },
            { icon: FileText, title: "Invoice & Payments", body: "Beautiful branded invoices, automated reminders, and a Pay Now button.", c: "accent" },
            { icon: MessageSquare, title: "Client Portal", body: "One link your clients sign into to see progress, approve work, and pay you.", c: "warning" },
          ].map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className={`grid h-12 w-12 place-items-center rounded-xl bg-${f.c}/10 text-${f.c}`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {["No setup required", "Built for solo work", "Clients love it"].map((b) => (
                  <li key={b} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-success" /> {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="border-y border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Loved by 12,000+ freelancers</h2>
            <p className="mt-3 text-muted-foreground">Don't take our word for it.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { n: "Maya Chen", r: "Brand Designer", t: "Tela replaced four tools. My clients keep asking what I'm using — it just looks professional." },
              { n: "Daniel Okafor", r: "Full-stack Dev", t: "Getting paid used to take weeks of follow-ups. Now invoices go out in a click and reminders just work." },
              { n: "Lena Petrov", r: "Copywriter", t: "The client portal is a game-changer. No more endless email threads about what's approved." },
            ].map((t) => (
              <figure key={t.n} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <blockquote className="text-sm leading-relaxed">"{t.t}"</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {t.n.split(" ").map((x) => x[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.n}</p>
                    <p className="text-xs text-muted-foreground">{t.r}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center md:px-6">
        <h2 className="text-3xl font-bold md:text-4xl">Ready to look like a pro?</h2>
        <p className="mt-3 text-muted-foreground">Set up your first client in under 60 seconds.</p>
        <Link
          to="/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:opacity-90"
        >
          Get Started Free <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <footer className="border-t border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-bold">Tela</span>
            </Link>
            <p className="mt-3 max-w-xs text-xs text-muted-foreground">The freelancer workspace your clients will love.</p>
          </div>
          {[
            { h: "Product", l: ["Features", "Pricing", "Changelog", "Roadmap"] },
            { h: "Company", l: ["About", "Blog", "Careers", "Contact"] },
            { h: "Legal", l: ["Privacy", "Terms", "Security", "DPA"] },
          ].map((g) => (
            <div key={g.h}>
              <p className="text-sm font-semibold">{g.h}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {g.l.map((x) => (
                  <li key={x}><a href="#" className="hover:text-foreground">{x}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          © 2026 Tela Studio. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
