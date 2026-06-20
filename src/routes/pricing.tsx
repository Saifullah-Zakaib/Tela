import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2, Sparkles, Zap, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { subscriptionApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { pricingBeforeLoad } from "@/lib/route-guards";
import { hasActiveSubscription } from "@/lib/subscription";
import { cn } from "@/lib/utils";

type PricingSearch = {
  success?: string;
  canceled?: string;
  session_id?: string;
};

export const Route = createFileRoute("/pricing")({
  beforeLoad: pricingBeforeLoad,
  validateSearch: (search: Record<string, unknown>): PricingSearch => ({
    success: typeof search.success === 'string' ? search.success : undefined,
    canceled: typeof search.canceled === 'string' ? search.canceled : undefined,
    session_id: typeof search.session_id === 'string' ? search.session_id : undefined,
  }),
  head: () => ({ meta: [{ title: "Choose your plan — Tela" }] }),
  component: Pricing,
});

const PLANS = [
  {
    id: "trial",
    name: "Start free trial",
    price: "Free",
    period: "14 days",
    description: "Full access to every Pro feature. No credit card required.",
    features: [
      "Unlimited projects & clients",
      "Branded client portal",
      "Invoices & proposals",
      "Milestone workflow",
      "File sharing & feed",
    ],
    cta: "Start 14-day trial",
    highlighted: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9.99",
    period: "per month",
    description: "Everything you need to run your freelance studio professionally.",
    features: [
      "Everything in trial",
      "Unlimited invoices & proposals",
      "Stripe payment collection",
      "Email notifications",
      "Priority support",
    ],
    cta: "Subscribe with Stripe",
    highlighted: false,
  },
  {
    id: "custom",
    name: "Custom",
    price: "Let's talk",
    period: "tailored",
    description: "For agencies and teams that need custom branding, SSO, or dedicated support.",
    features: [
      "Everything in Pro",
      "Custom branding & domain",
      "Team seats & roles",
      "Dedicated account manager",
      "Custom integrations",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
] as const;

function formatTrialEnd(dateStr?: string) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function Pricing() {
  const nav = useNavigate();
  const { freelancer, refreshUser, setFreelancerUser } = useAuth();
  const { success, canceled, session_id } = Route.useSearch();
  const [loading, setLoading] = useState<string | null>(null);

  const isOnTrial =
    !!freelancer &&
    freelancer.subscriptionPlan === "trial" &&
    hasActiveSubscription(freelancer);
  const trialEndsLabel = formatTrialEnd(freelancer?.trialEndsAt);

  useEffect(() => {
    if (canceled) {
      toast.message("Checkout canceled. You can try again anytime.");
    }
  }, [canceled]);

  useEffect(() => {
    if (!success || !session_id) return;

    let active = true;
    (async () => {
      try {
        await subscriptionApi.confirmCheckout(session_id);
        await refreshUser();
        if (!active) return;
        toast.success("Subscription activated! Welcome to Tela Pro.");
        nav({ to: "/dashboard", search: {} });
      } catch {
        if (!active) return;
        toast.error("We couldn't confirm your payment yet. Please refresh or contact support.");
      }
    })();

    return () => {
      active = false;
    };
  }, [success, session_id, refreshUser, nav]);

  async function selectPlan(planId: string) {
    setLoading(planId);
    try {
      if (planId === "trial") {
        const response = await subscriptionApi.startTrial();
        if (response.data?.user) {
          setFreelancerUser(response.data.user);
        }
        await refreshUser('freelancer');
        toast.success("Your 14-day free trial has started!");
        nav({ to: "/dashboard", replace: true });
        return;
      }

      if (planId === "pro") {
        const response = await subscriptionApi.createCheckout();
        const url = response.data?.url;
        if (url) {
          window.location.href = url;
          return;
        }
        toast.error("Could not start checkout. Please try again.");
        return;
      }

      if (planId === "custom") {
        nav({ to: "/contact-sales" });
        return;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">Tela</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            {isOnTrial ? "Upgrade your plan anytime" : "Choose a plan to unlock your workspace"}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Welcome to Tela</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            {isOnTrial ? "Upgrade to keep full access" : "Pick how you want to get started"}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {isOnTrial
              ? "You're on the 14-day free trial. Subscribe to Pro before it ends to keep using every feature without interruption."
              : "Start with a 14-day free trial — no card needed — or subscribe to Pro for $9.99/month. You need an active plan before using any freelancer features."}
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isTrialPlan = plan.id === "trial";
            const trialActive = isTrialPlan && isOnTrial;
            const isRecommended = isOnTrial ? plan.id === "pro" : plan.highlighted;

            return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-xl border p-6",
                isRecommended
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border bg-card",
                trialActive && "ring-2 ring-primary/30",
              )}
            >
              {isRecommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                  {isOnTrial && plan.id === "pro" ? "Upgrade" : "Recommended"}
                </span>
              )}

              {trialActive && (
                <span className="absolute -top-3 right-4 rounded-full border border-primary/30 bg-background px-3 py-0.5 text-xs font-medium text-primary">
                  Current plan
                </span>
              )}

              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                {plan.id === "trial" && <Zap className="h-5 w-5 text-primary" />}
                {plan.id === "pro" && <Sparkles className="h-5 w-5 text-primary" />}
                {plan.id === "custom" && <Building2 className="h-5 w-5 text-primary" />}
              </div>

              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {trialActive
                  ? `You're using the free trial${trialEndsLabel ? ` — ends ${trialEndsLabel}` : ""}.`
                  : plan.description}
              </p>

              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              {trialActive ? (
                <div className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 text-sm font-semibold text-primary">
                  <Check className="h-4 w-4" />
                  You're using free trial
                </div>
              ) : (
                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={() => selectPlan(plan.id)}
                  className={cn(
                    "mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition disabled:opacity-60",
                    isRecommended
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "border border-border bg-background hover:bg-muted",
                  )}
                >
                  {loading === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading === plan.id ? "Processing…" : plan.cta}
                </button>
              )}
            </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Pro plan billed monthly via Stripe. Cancel anytime from your account settings.
        </p>
      </main>
    </div>
  );
}
