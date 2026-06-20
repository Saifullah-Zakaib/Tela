export type Status =
  | "planning"
  | "in_progress"
  | "under_review"
  | "completed"
  | "pending"
  | "approved"
  | "paid"
  | "overdue"
  | "draft"
  | "sent";

export const STATUS_LABEL: Record<Status, string> = {
  planning: "Planning",
  in_progress: "In Progress",
  under_review: "Under Review",
  completed: "Completed",
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
  overdue: "Overdue",
  draft: "Draft",
  sent: "Sent",
};

export function normalizeProjectStatus(status: string): Status {
  const normalized = String(status || 'planning').toLowerCase().replace(/-/g, '_');
  if (normalized in STATUS_LABEL) return normalized as Status;
  return 'planning';
}

export const clients = [
  {
    id: "c1",
    name: "Ahmed Hassan",
    company: "Nile Studios",
    email: "ahmed@nilestudios.com",
    phone: "+20 100 555 4422",
    joined: "Feb 2024",
    activeProjects: 2,
  },
  {
    id: "c2",
    name: "Sara Lindqvist",
    company: "Northwind Co.",
    email: "sara@northwind.io",
    phone: "+46 70 123 4567",
    joined: "May 2024",
    activeProjects: 1,
  },
  {
    id: "c3",
    name: "Marcus Webb",
    company: "Webb & Co.",
    email: "marcus@webbco.com",
    phone: "+1 415 555 0144",
    joined: "Aug 2024",
    activeProjects: 3,
  },
  {
    id: "c4",
    name: "Priya Raman",
    company: "Lumen Health",
    email: "priya@lumen.health",
    phone: "+91 98765 43210",
    joined: "Jan 2025",
    activeProjects: 1,
  },
  {
    id: "c5",
    name: "Jonas Müller",
    company: "Atlas Bikes",
    email: "jonas@atlasbikes.de",
    phone: "+49 30 1234567",
    joined: "Mar 2025",
    activeProjects: 0,
  },
];

export const projects = [
  {
    id: "p1",
    name: "Brand Identity Refresh",
    clientId: "c1",
    status: "in_progress" as Status,
    deadline: "Aug 14, 2026",
    budget: 6800,
    progress: 60,
  },
  {
    id: "p2",
    name: "Marketing Site v3",
    clientId: "c2",
    status: "under_review" as Status,
    deadline: "Jul 02, 2026",
    budget: 12400,
    progress: 85,
  },
  {
    id: "p3",
    name: "Mobile App Onboarding",
    clientId: "c3",
    status: "planning" as Status,
    deadline: "Sep 20, 2026",
    budget: 9500,
    progress: 12,
  },
  {
    id: "p4",
    name: "E-commerce Replatform",
    clientId: "c3",
    status: "in_progress" as Status,
    deadline: "Oct 10, 2026",
    budget: 22000,
    progress: 45,
  },
  {
    id: "p5",
    name: "Patient Portal UX Audit",
    clientId: "c4",
    status: "completed" as Status,
    deadline: "Apr 30, 2026",
    budget: 4200,
    progress: 100,
  },
  {
    id: "p6",
    name: "Annual Report Design",
    clientId: "c1",
    status: "planning" as Status,
    deadline: "Nov 12, 2026",
    budget: 3800,
    progress: 5,
  },
];

export const milestones = [
  { id: "m1", projectId: "p1", name: "Discovery & moodboards", due: "Jun 20, 2026", amount: 1500, status: "approved" as Status },
  { id: "m2", projectId: "p1", name: "Logo concepts (3 directions)", due: "Jul 04, 2026", amount: 2000, status: "completed" as Status },
  { id: "m3", projectId: "p1", name: "Brand system & guidelines", due: "Jul 28, 2026", amount: 2300, status: "in_progress" as Status },
  { id: "m4", projectId: "p1", name: "Final delivery & handoff", due: "Aug 14, 2026", amount: 1000, status: "pending" as Status },
  { id: "m5", projectId: "p2", name: "Information architecture", due: "May 12, 2026", amount: 2400, status: "approved" as Status },
  { id: "m6", projectId: "p2", name: "Visual design", due: "Jun 14, 2026", amount: 4800, status: "approved" as Status },
  { id: "m7", projectId: "p2", name: "Build & QA", due: "Jul 02, 2026", amount: 5200, status: "under_review" as Status },
];

export const invoices = [
  { id: "INV-0042", projectId: "p1", clientId: "c1", amount: 1500, status: "paid" as Status, due: "Jun 25, 2026", issued: "Jun 11, 2026" },
  { id: "INV-0043", projectId: "p2", clientId: "c2", amount: 4800, status: "paid" as Status, due: "Jun 18, 2026", issued: "Jun 04, 2026" },
  { id: "INV-0044", projectId: "p1", clientId: "c1", amount: 2000, status: "sent" as Status, due: "Jul 08, 2026", issued: "Jun 24, 2026" },
  { id: "INV-0045", projectId: "p4", clientId: "c3", amount: 5500, status: "overdue" as Status, due: "Jun 02, 2026", issued: "May 18, 2026" },
  { id: "INV-0046", projectId: "p3", clientId: "c3", amount: 1900, status: "draft" as Status, due: "Jul 15, 2026", issued: "—" },
  { id: "INV-0047", projectId: "p5", clientId: "c4", amount: 4200, status: "paid" as Status, due: "May 12, 2026", issued: "Apr 28, 2026" },
];

export const activity = [
  { id: "a1", type: "approved", text: "Ahmed Hassan approved milestone “Logo concepts”", when: "12m ago" },
  { id: "a2", type: "paid", text: "Invoice INV-0043 was paid — $4,800", when: "2h ago" },
  { id: "a3", type: "message", text: "New message from Sara on Marketing Site v3", when: "5h ago" },
  { id: "a4", type: "file", text: "Marcus Webb uploaded brand-assets.zip", when: "Yesterday" },
  { id: "a5", type: "overdue", text: "Invoice INV-0045 is now overdue", when: "Yesterday" },
  { id: "a6", type: "approved", text: "Priya approved the final UX audit deliverable", when: "2d ago" },
];

export const notifications = [
  { id: "n1", icon: "check", text: "Ahmed approved Milestone 2 on Brand Identity Refresh", when: "12m", unread: true },
  { id: "n2", icon: "invoice", text: "Invoice INV-0043 was paid — $4,800", when: "2h", unread: true },
  { id: "n3", icon: "message", text: "Sara sent you a new message", when: "5h", unread: true },
  { id: "n4", icon: "file", text: "Marcus uploaded brand-assets.zip", when: "1d", unread: false },
  { id: "n5", icon: "warn", text: "Invoice INV-0045 is overdue", when: "1d", unread: false },
];

export const messages = [
  { id: "msg1", projectId: "p1", author: "Ahmed Hassan", role: "client", text: "Loving direction #2. Could we explore a warmer palette?", when: "Mon 10:14" },
  { id: "msg2", projectId: "p1", author: "You", role: "freelancer", text: "Absolutely — uploading a revised set this afternoon.", when: "Mon 10:32", attachments: ["concepts-v2.pdf"] },
  { id: "msg3", projectId: "p1", author: "Ahmed Hassan", role: "client", text: "Perfect. Sharing with the team now.", when: "Mon 14:01" },
];

export const files = [
  { id: "f1", name: "brand-guidelines-v2.pdf", type: "pdf", size: "4.2 MB", uploaded: "Jun 12, 2026", by: "You" },
  { id: "f2", name: "moodboard.jpg", type: "image", size: "2.1 MB", uploaded: "Jun 08, 2026", by: "You" },
  { id: "f3", name: "brand-assets.zip", type: "zip", size: "18.7 MB", uploaded: "Jun 04, 2026", by: "Ahmed" },
  { id: "f4", name: "logo-marks.png", type: "image", size: "780 KB", uploaded: "Jun 02, 2026", by: "You" },
];

export const proposals = [
  { id: "pr1", title: "Brand Identity Refresh", clientId: "c1", total: 6800, status: "approved" as Status, sent: "May 22, 2026" },
  { id: "pr2", title: "Marketing Site v3", clientId: "c2", total: 12400, status: "approved" as Status, sent: "Apr 10, 2026" },
  { id: "pr3", title: "Mobile App Onboarding", clientId: "c3", total: 9500, status: "sent" as Status, sent: "Jun 15, 2026" },
];

export function clientById(id: string) {
  return clients.find((c) => c.id === id);
}
export function projectById(id: string) {
  return projects.find((p) => p.id === id);
}
export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
export function fmtMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}