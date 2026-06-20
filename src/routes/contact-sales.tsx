import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Building2, CheckCircle, Loader2, Mail, Phone, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { contactApi } from "@/lib/api";

export const Route = createFileRoute("/contact-sales")({
  head: () => ({ meta: [{ title: "Contact Sales — Tela" }] }),
  component: ContactSales,
});

const TEAM_SIZES = [
  "1-5 people",
  "6-10 people",
  "11-25 people",
  "26-50 people",
  "51-100 people",
  "100+ people",
];

const INTERESTED_IN = [
  "Custom branding & domain",
  "Team seats & roles",
  "SSO & advanced security",
  "Dedicated account manager",
  "Custom integrations",
  "API access",
  "Other",
];

function ContactSales() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
    teamSize: "",
    interestedIn: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.company) {
      toast.error("Please fill in all required fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await contactApi.submitSales(formData);
      setSubmitted(true);
      toast.success("Thank you! We'll be in touch within 24 hours.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold">Tela</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-6 py-24">
          <div className="text-center">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Thank you for reaching out!</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              We've received your inquiry and will get back to you within 24 hours.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">
              Check your email ({formData.email}) for a confirmation message.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => nav({ to: "/pricing" })}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-6 text-sm font-semibold transition hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Pricing
              </button>
              <Link
                to="/"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">Tela</span>
          </Link>
          <button
            onClick={() => nav({ to: "/pricing" })}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Pricing
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Left column - Info */}
          <div className="lg:col-span-2">
            <div className="sticky top-12">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-4xl font-semibold tracking-tight">
                Let's build something great together
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Tell us about your team and we'll create a custom plan tailored to your needs.
              </p>

              <div className="mt-10 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Tailored for teams</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Custom branding, SSO, team seats, and advanced features designed for agencies and growing businesses.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">24-hour response time</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Our sales team will review your inquiry and respond within one business day with next steps.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Personalized demo</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      We'll schedule a call to understand your workflow and show you how Tela can help your team thrive.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 rounded-xl border border-border bg-muted/50 p-6">
                <p className="text-sm font-semibold">Not ready to talk?</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try our <Link to="/pricing" className="text-primary hover:underline">14-day free trial</Link> to explore all Pro features — no credit card required.
                </p>
              </div>
            </div>
          </div>

          {/* Right column - Form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
              <h2 className="text-2xl font-semibold">Get in touch</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Fill out the form below and we'll be in touch within 24 hours.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                {/* Name fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium">
                      First name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium">
                      Last name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="Smith"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium">
                    Work email <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="john@company.com"
                  />
                </div>

                {/* Company */}
                <div>
                  <label htmlFor="company" className="block text-sm font-medium">
                    Company name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    required
                    className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Acme Inc."
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium">
                    Phone number <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                {/* Team size */}
                <div>
                  <label htmlFor="teamSize" className="block text-sm font-medium">
                    Team size <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <select
                    id="teamSize"
                    name="teamSize"
                    value={formData.teamSize}
                    onChange={handleChange}
                    className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select team size</option>
                    {TEAM_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Interested in */}
                <div>
                  <label htmlFor="interestedIn" className="block text-sm font-medium">
                    What are you interested in? <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <select
                    id="interestedIn"
                    name="interestedIn"
                    value={formData.interestedIn}
                    onChange={handleChange}
                    className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select an option</option>
                    {INTERESTED_IN.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium">
                    Tell us about your needs <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Tell us about your team, workflow, and what features matter most to you..."
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send inquiry
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  By submitting this form, you agree to our privacy policy and terms of service.
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
