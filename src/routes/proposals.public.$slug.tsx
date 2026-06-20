import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles, X, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/portal/Bits";
import { proposalsApi } from "@/lib/api";
import { fmtMoney } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/proposals/public/$slug")({
  head: () => ({ meta: [{ title: "Proposal — Tela" }] }),
  component: PublicProposal,
});

function PublicProposal() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const [responded, setResponded] = useState(false);
  const [response, setResponse] = useState<'accepted' | 'rejected' | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-proposal', slug],
    queryFn: () => proposalsApi.getPublic(slug),
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: () => proposalsApi.accept(data?.data._id, slug),
    onSuccess: () => {
      setResponded(true);
      setResponse('accepted');
      toast.success('Proposal accepted!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to accept proposal');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => proposalsApi.reject(data?.data._id, slug),
    onSuccess: () => {
      setResponded(true);
      setResponse('rejected');
      toast.success('Response recorded');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reject proposal');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading proposal...</p>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <p className="text-destructive font-medium">Proposal not found</p>
          <p className="text-sm text-muted-foreground mt-2">This proposal link may be invalid or expired.</p>
        </Card>
      </div>
    );
  }

  const proposal = data.data;
  const freelancer = proposal.freelancer;
  const client = proposal.client;
  const alreadyResponded = proposal.status !== 'pending';
  
  // Check if current user is the freelancer who created this proposal
  const isFreelancerView = user && user.role === 'freelancer' && 
    (user._id === freelancer?._id || user.email === freelancer?.email);
  
  // Show accept/decline buttons only to non-freelancer viewers (clients or anonymous)
  const canRespond = !isFreelancerView;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold">Tela</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Freelancer Info */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
            <span className="text-2xl font-bold">{freelancer?.name?.[0] || 'F'}</span>
          </div>
          <h1 className="text-3xl font-bold">{freelancer?.businessName || freelancer?.name}</h1>
          <p className="mt-1 text-muted-foreground">{freelancer?.email}</p>
        </div>

        {/* Status Banner */}
        {(alreadyResponded || responded) && (
          <Card className={cn(
            "mb-6 p-6 text-center",
            (proposal.status === 'accepted' || response === 'accepted') ? "bg-success/5 border-success/30" : "bg-muted"
          )}>
            <div className="flex items-center justify-center gap-2">
              {(proposal.status === 'accepted' || response === 'accepted') ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <p className="font-semibold text-success">Proposal Accepted</p>
                </>
              ) : (proposal.status === 'rejected' || response === 'rejected') ? (
                <>
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  <p className="font-semibold text-muted-foreground">Proposal Declined</p>
                </>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {(proposal.status === 'accepted' || response === 'accepted')
                ? `${freelancer?.name} has been notified and will be in touch soon.`
                : 'Thank you for your response.'}
            </p>
          </Card>
        )}

        {/* Proposal Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-primary to-accent p-8 text-primary-foreground">
            <p className="text-sm uppercase tracking-wide opacity-90">Proposal</p>
            <h2 className="mt-2 text-3xl font-bold">{proposal.title}</h2>
            <p className="mt-2 opacity-90">
              Prepared for {client?.name}
              {client?.company && ` • ${client.company}`}
            </p>
          </div>

          <div className="space-y-8 p-8">
            {/* Description */}
            {proposal.description && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Overview
                </h3>
                <p className="leading-relaxed text-foreground whitespace-pre-wrap">
                  {proposal.description}
                </p>
              </div>
            )}

            {/* Deliverables */}
            {proposal.deliverables && proposal.deliverables.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Deliverables
                </h3>
                <ul className="space-y-2">
                  {proposal.deliverables.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Timeline & Price */}
            <div className="grid gap-6 rounded-xl border border-border bg-muted/30 p-6 sm:grid-cols-2">
              {proposal.timeline && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Timeline
                  </p>
                  <p className="mt-2 text-lg font-semibold">{proposal.timeline}</p>
                </div>
              )}
              <div className={!proposal.timeline ? 'sm:col-span-2' : ''}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Investment
                </p>
                <p className="mt-2 text-3xl font-bold text-primary">
                  {fmtMoney(proposal.price || 0)}
                </p>
              </div>
            </div>

            {/* Payment Terms */}
            {proposal.paymentTerms && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Payment Terms
                </h3>
                <p className="leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {proposal.paymentTerms}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            {!alreadyResponded && !responded && canRespond && (
              <div className="flex flex-col gap-3 border-t border-border pt-8 sm:flex-row">
                <button
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending || rejectMutation.isPending}
                  className="flex-1 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {acceptMutation.isPending ? 'Accepting...' : 'Accept Proposal'}
                </button>
                <button
                  onClick={() => rejectMutation.mutate()}
                  disabled={acceptMutation.isPending || rejectMutation.isPending}
                  className="flex-1 rounded-xl border border-border bg-background px-6 py-3 font-semibold transition hover:bg-muted disabled:opacity-50"
                >
                  {rejectMutation.isPending ? 'Declining...' : 'Decline'}
                </button>
              </div>
            )}
            
            {/* Preview Mode Message for Freelancer */}
            {!alreadyResponded && !responded && isFreelancerView && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
                <p className="text-sm font-medium text-primary">
                  📋 Preview Mode
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your client will see accept/decline buttons when they open this link.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Questions? Contact {freelancer?.name} at{' '}
            <a href={`mailto:${freelancer?.email}`} className="text-primary hover:underline">
              {freelancer?.email}
            </a>
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Powered by <span className="font-semibold">Tela</span>
          </p>
        </div>
      </main>
    </div>
  );
}
