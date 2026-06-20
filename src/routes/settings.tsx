import { createFileRoute } from "@tanstack/react-router";
import { Camera, LogOut, Monitor, Smartphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/portal/DashboardLayout";
import { Avatar, Card } from "@/components/portal/Bits";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { authApi } from "@/lib/api";
import { freelancerAppBeforeLoad } from "@/lib/route-guards";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export const Route = createFileRoute("/settings")({
  beforeLoad: freelancerAppBeforeLoad,
  head: () => ({ meta: [{ title: "Settings — Tela" }] }),
  component: Settings,
});

const TABS = ["profile", "branding", "email", "notifications", "security"] as const;

function Settings() {
  const { user: authUser, isAuthenticated } = useRequireAuth('freelancer');
  const [tab, setTab] = useState<(typeof TABS)[number]>("profile");
  
  if (!isAuthenticated) {
    return <DashboardLayout title="Loading..."><div>Loading...</div></DashboardLayout>;
  }
  return (
    <DashboardLayout title="Settings">
      <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
      <p className="mt-1 text-sm text-muted-foreground">Manage your studio preferences and branding.</p>

      <div className="mt-6 flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("relative px-4 py-2.5 text-sm font-medium capitalize transition", tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t}
            {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "profile" && <Profile />}
        {tab === "branding" && <Branding />}
        {tab === "email" && <EmailConfig />}
        {tab === "notifications" && <Notifications />}
        {tab === "security" && <Security />}
      </div>
    </DashboardLayout>
  );
}

const inp = "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary";
function Lbl({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium">{label}</span>{children}</label>;
}

function Profile() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    bio: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await authApi.updateProfile(formData);
      await refreshUser();
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative">
            <Avatar name={user?.name || 'User'} className="h-20 w-20 text-2xl" />
            <button type="button" className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border border-border bg-card hover:bg-muted">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <p className="font-semibold">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Lbl label="Full name">
            <input 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inp}
              required
            />
          </Lbl>
          <Lbl label="Email">
            <input 
              type="email"
              value={formData.email} 
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={inp}
              required
            />
          </Lbl>
          <Lbl label="Phone">
            <input 
              value={formData.phone} 
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={inp}
              placeholder="+1 415 555 0102"
            />
          </Lbl>
          <Lbl label="Location">
            <input 
              value={formData.location} 
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className={inp}
              placeholder="San Francisco, CA"
            />
          </Lbl>
          <div className="sm:col-span-2">
            <Lbl label="Bio">
              <textarea 
                rows={3} 
                value={formData.bio} 
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className={inp + " resize-none py-2"}
                placeholder="Tell us about yourself..."
              />
            </Lbl>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button 
            type="submit"
            disabled={loading}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </Card>
  );
}

function Branding() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: user?.businessName || '',
    tagline: '',
    brandColor: user?.brandColor || '#4F46E5',
  });

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      await authApi.updateProfile(formData);
      await refreshUser();
      toast.success("Branding saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save branding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <h3 className="font-semibold">Brand identity</h3>
        <div className="mt-5 space-y-4">
          <div>
            <span className="mb-1.5 block text-sm font-medium">Logo</span>
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground font-bold">
                {formData.businessName?.[0]?.toUpperCase() || 'T'}
              </div>
              <button type="button" className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Upload logo</button>
            </div>
          </div>
          <Lbl label="Business name">
            <input 
              value={formData.businessName} 
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className={inp}
              placeholder="Your business name"
            />
          </Lbl>
          <Lbl label="Tagline">
            <input 
              value={formData.tagline} 
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className={inp}
              placeholder="Your tagline"
            />
          </Lbl>
          <Lbl label="Primary color">
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                value={formData.brandColor} 
                onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                className="h-11 w-14 cursor-pointer rounded-xl border border-input bg-transparent" 
              />
              <input 
                value={formData.brandColor} 
                onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                className={inp}
                placeholder="#4F46E5"
              />
            </div>
          </Lbl>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save branding"}
        </button>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-5"><h3 className="font-semibold">Client portal preview</h3><p className="text-xs text-muted-foreground">How your branding appears to clients.</p></div>
        <div className="border-t border-border" style={{ background: formData.brandColor + "08" }}>
          <div className="p-6">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl text-white font-bold" style={{ background: formData.brandColor }}>
                {formData.businessName?.[0]?.toUpperCase() || 'T'}
              </div>
              <span className="font-bold">{formData.businessName || 'Your Business'}</span>
            </div>
            <p className="mt-5 text-xs uppercase tracking-wide text-muted-foreground">Welcome back, Client</p>
            <p className="mt-2 text-xl font-semibold">Your active project</p>
            <div className="mt-4 rounded-xl border border-border bg-card p-4">
              <p className="font-medium">Brand Identity Refresh</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ background: formData.brandColor, width: "60%" }} />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Notifications() {
  const opts = [
    { l: "Invoice paid", d: "When a client successfully pays an invoice.", key: 'invoicePaid' },
    { l: "Milestone approved", d: "When a client approves a completed milestone.", key: 'milestoneApproved' },
    { l: "New message", d: "When a client sends a message on any project.", key: 'newMessage' },
    { l: "Proposal accepted", d: "When a client accepts a proposal.", key: 'proposalAccepted' },
    { l: "Weekly digest", d: "A summary of activity every Monday morning.", key: 'weeklyDigest' },
  ];
  
  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    invoicePaid: true,
    milestoneApproved: true,
    newMessage: true,
    proposalAccepted: true,
    weeklyDigest: false
  });

  const handleToggle = (key: string) => {
    const newPreferences = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPreferences);
    
    // Save to localStorage for persistence
    localStorage.setItem('notificationPreferences', JSON.stringify(newPreferences));
    toast.success("Notification preference updated");
  };

  return (
    <Card className="p-6">
      <h3 className="font-semibold">Notification preferences</h3>
      <div className="mt-4 divide-y divide-border">
        {opts.map((o) => (
          <div key={o.key} className="flex items-start justify-between gap-4 py-4">
            <div><p className="text-sm font-medium">{o.l}</p><p className="text-xs text-muted-foreground">{o.d}</p></div>
            <button 
              onClick={() => handleToggle(o.key)} 
              className={cn("relative h-6 w-11 rounded-full transition", preferences[o.key] ? "bg-primary" : "bg-muted")}
            >
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", preferences[o.key] ? "left-5" : "left-0.5")} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Security() {
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    
    try {
      await authApi.updatePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success("Password updated successfully");
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <h3 className="font-semibold">Change password</h3>
        <form onSubmit={handlePasswordChange}>
          <div className="mt-5 space-y-4">
            <Lbl label="Current password">
              <input 
                type="password" 
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                className={inp}
                required
              />
            </Lbl>
            <Lbl label="New password">
              <input 
                type="password" 
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className={inp}
                required
                minLength={6}
              />
            </Lbl>
            <Lbl label="Confirm new password">
              <input 
                type="password" 
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className={inp}
                required
                minLength={6}
              />
            </Lbl>
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="mt-6 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      </Card>
      <Card className="p-6">
        <h3 className="font-semibold">Active sessions</h3>
        <div className="mt-4 divide-y divide-border">
          {[
            { d: "Current Device — Browser", w: "Active now", i: Monitor },
          ].map((s) => (
            <div key={s.d} className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted"><s.i className="h-4 w-4" /></div>
                <div><p className="text-sm font-medium">{s.d}</p><p className="text-xs text-muted-foreground">{s.w}</p></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}


function EmailConfig() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: user?.email || '',
    smtpPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authApi.configureEmail(formData);
      toast.success('Email configuration saved successfully!');
      setFormData({ ...formData, smtpPassword: '' }); // Clear password field
    } catch (error: any) {
      toast.error(error.message || 'Failed to save email configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-2">Email Configuration</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Configure your email account to send client invitations from your own email address.
      </p>

      <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <h4 className="font-medium text-sm mb-2">📧 Gmail Setup Instructions:</h4>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Account Security</a></li>
          <li>Enable 2-Step Verification</li>
          <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">App Passwords</a></li>
          <li>Create app password for "Mail" → Copy the 16-character password</li>
          <li>Paste it in the "SMTP Password" field below</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Lbl label="SMTP Host">
            <input
              value={formData.smtpHost}
              onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
              placeholder="smtp.gmail.com"
              className={inp}
              required
            />
          </Lbl>

          <Lbl label="SMTP Port">
            <input
              type="number"
              value={formData.smtpPort}
              onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
              placeholder="587"
              className={inp}
              required
            />
          </Lbl>
        </div>

        <Lbl label="SMTP User (Your Email)">
          <input
            type="email"
            value={formData.smtpUser}
            onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
            placeholder="your.email@gmail.com"
            className={inp}
            required
          />
        </Lbl>

        <Lbl label="SMTP Password (App Password)">
          <input
            type="password"
            value={formData.smtpPassword}
            onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
            placeholder="16-character app password"
            className={inp}
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Use Gmail App Password, not your regular password
          </p>
        </Lbl>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Email Configuration'}
          </button>
        </div>
      </form>
    </Card>
  );
}
