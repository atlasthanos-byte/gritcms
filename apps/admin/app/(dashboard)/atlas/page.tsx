"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  X,
  Users,
  DollarSign,
  TrendingUp,
  Briefcase,
  BookOpen,
  Bot,
  FileText,
  Package,
  BarChart3,
  CalendarCheck,
  Globe,
  Search,
  ChevronLeft,
  ChevronRight,
  Flame,
  Eye,
  ThumbsUp,
  Clock,
} from "@/lib/icons";
import {
  useAtlasDashboard,
  useAtlasContacts,
  useCreateAtlasContact,
  useUpdateAtlasContact,
  useDeleteAtlasContact,
  useAtlasProjects,
  useCreateAtlasProject,
  useAtlasCourses,
  useCreateAtlasCourse,
  useAtlasAgentClients,
  useCreateAtlasAgentClient,
  useAtlasAgentRevenue,
  useAtlasContent,
  useCreateAtlasContent,
  useAtlasProducts,
  useCreateAtlasProduct,
  useAtlasRevenue,
  useCreateAtlasRevenue,
  useAtlasRevenueByStream,
  useAtlasWeeklyRevenue,
  useAtlasMonthlyRevenue,
  useAtlasMRR,
  useAtlasDailyLogs,
  useAtlasTodayLog,
  useCreateAtlasLog,
  useAtlasStreak,
  useAtlasWebsiteTasks,
  useCreateAtlasWebsiteTask,
} from "@/hooks/use-atlas";
import { useConfirm } from "@/hooks/use-confirm";
import Link from "next/link";
import type {
  AtlasContact,
  AtlasProject,
  AtlasCourse,
  AtlasAgentClient,
  AtlasContent,
  AtlasProduct,
  AtlasRevenueEntry,
  AtlasDailyLog,
  AtlasWebsiteTask,
} from "@repo/shared/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type MainTab = "dashboard" | "contacts" | "projects" | "courses" | "agents" | "content" | "products" | "revenue" | "ops" | "websites";

const MAIN_TABS: { key: MainTab; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "contacts", label: "Contacts", icon: Users },
  { key: "projects", label: "Projects", icon: Briefcase },
  { key: "courses", label: "Courses", icon: BookOpen },
  { key: "agents", label: "Agents", icon: Bot },
  { key: "content", label: "Content", icon: FileText },
  { key: "products", label: "Products", icon: Package },
  { key: "revenue", label: "Revenue", icon: DollarSign },
  { key: "ops", label: "Daily Ops", icon: CalendarCheck },
  { key: "websites", label: "Websites", icon: Globe },
];

const CONTACT_TYPE_OPTIONS = [
  { label: "All", value: "" },
  { label: "Prospect", value: "prospect" },
  { label: "Client", value: "client" },
  { label: "Student", value: "student" },
  { label: "Agent Client", value: "agent_client" },
  { label: "Partner", value: "partner" },
] as const;

const CONTACT_STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Replied", value: "replied" },
  { label: "Call Booked", value: "call_booked" },
  { label: "Proposal Sent", value: "proposal_sent" },
  { label: "Won", value: "won" },
  { label: "Lost", value: "lost" },
  { label: "Churned", value: "churned" },
] as const;

const SOURCE_OPTIONS = [
  { label: "All", value: "" },
  { label: "YouTube", value: "youtube" },
  { label: "LinkedIn", value: "linkedin" },
  { label: "TikTok", value: "tiktok" },
  { label: "Referral", value: "referral" },
  { label: "Cold Outreach", value: "cold_outreach" },
  { label: "Website", value: "website" },
  { label: "Gumroad", value: "gumroad" },
] as const;

const ICP_OPTIONS = ["A", "B", "C", "D", "E", "F"] as const;

const contactStatusBadge: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-400",
  contacted: "bg-yellow-500/10 text-yellow-400",
  replied: "bg-cyan-500/10 text-cyan-400",
  call_booked: "bg-purple-500/10 text-purple-400",
  proposal_sent: "bg-orange-500/10 text-orange-400",
  won: "bg-green-500/10 text-green-400",
  lost: "bg-red-500/10 text-red-400",
  churned: "bg-red-500/10 text-red-400",
};

const projectStatusBadge: Record<string, string> = {
  discovery: "bg-blue-500/10 text-blue-400",
  proposal_sent: "bg-orange-500/10 text-orange-400",
  negotiation: "bg-yellow-500/10 text-yellow-400",
  won: "bg-green-500/10 text-green-400",
  in_progress: "bg-cyan-500/10 text-cyan-400",
  delivered: "bg-purple-500/10 text-purple-400",
  invoiced: "bg-orange-500/10 text-orange-400",
  paid: "bg-green-500/10 text-green-400",
  lost: "bg-red-500/10 text-red-400",
};

const agentStatusBadge: Record<string, string> = {
  discovery: "bg-blue-500/10 text-blue-400",
  proposal: "bg-orange-500/10 text-orange-400",
  building: "bg-yellow-500/10 text-yellow-400",
  delivered: "bg-purple-500/10 text-purple-400",
  active: "bg-green-500/10 text-green-400",
  churned: "bg-red-500/10 text-red-400",
};

const contentStatusBadge: Record<string, string> = {
  idea: "bg-blue-500/10 text-blue-400",
  scripted: "bg-yellow-500/10 text-yellow-400",
  recording: "bg-orange-500/10 text-orange-400",
  editing: "bg-purple-500/10 text-purple-400",
  published: "bg-green-500/10 text-green-400",
  archived: "bg-red-500/10 text-red-400",
};

const productStatusBadge: Record<string, string> = {
  planned: "bg-blue-500/10 text-blue-400",
  building: "bg-yellow-500/10 text-yellow-400",
  published: "bg-green-500/10 text-green-400",
  archived: "bg-red-500/10 text-red-400",
};

const websiteStatusBadge: Record<string, string> = {
  planned: "bg-blue-500/10 text-blue-400",
  in_progress: "bg-yellow-500/10 text-yellow-400",
  completed: "bg-green-500/10 text-green-400",
  pushed: "bg-purple-500/10 text-purple-400",
};

function formatMoney(amount: number, currency = "USD") {
  return currency === "USD" ? `$${amount.toFixed(2)}` : `${currency} ${amount.toFixed(2)}`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Pagination Component
// ---------------------------------------------------------------------------

function Pagination({ page, pages, onPrev, onNext }: { page: number; pages: number; onPrev: () => void; onNext: () => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
      <span className="text-sm text-text-muted">
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <button onClick={onPrev} disabled={page <= 1} className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-elevated disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button onClick={onNext} disabled={page >= pages} className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-elevated disabled:opacity-40">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AtlasPage() {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<MainTab>("dashboard");

  // -----------------------------------------------------------------------
  // Contacts state
  // -----------------------------------------------------------------------
  const [contactSearch, setContactSearch] = useState("");
  const [contactTypeFilter, setContactTypeFilter] = useState("");
  const [contactStatusFilter, setContactStatusFilter] = useState("");
  const [contactSourceFilter, setContactSourceFilter] = useState("");
  const [contactPage, setContactPage] = useState(1);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "",
    location: "",
    source: "website" as string,
    type: "prospect" as string,
    status: "new" as string,
    icp_profile: "C" as string,
    deal_value: 0,
    currency: "USD",
    notes: "",
  });

  // -----------------------------------------------------------------------
  // Projects state
  // -----------------------------------------------------------------------
  const [projectPage, setProjectPage] = useState(1);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    contact_id: 0,
    status: "discovery" as string,
    stage: "lead" as string,
    deal_value: 0,
    currency: "USD",
    deadline: "",
  });

  // -----------------------------------------------------------------------
  // Courses state
  // -----------------------------------------------------------------------
  const [coursePage, setCoursePage] = useState(1);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    pillar: "",
    duration: "",
    price: 0,
    currency: "USD",
    status: "planned" as string,
    gumroad_url: "",
  });

  // -----------------------------------------------------------------------
  // Agents state
  // -----------------------------------------------------------------------
  const [agentPage, setAgentPage] = useState(1);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [agentForm, setAgentForm] = useState({
    contact_id: 0,
    career: "",
    tier: "basic" as string,
    setup_fee: 0,
    monthly_fee: 0,
    currency: "USD",
    status: "discovery" as string,
    notes: "",
  });

  // -----------------------------------------------------------------------
  // Content state
  // -----------------------------------------------------------------------
  const [contentPlatformFilter, setContentPlatformFilter] = useState("");
  const [contentPage, setContentPage] = useState(1);
  const [showContentModal, setShowContentModal] = useState(false);
  const [contentForm, setContentForm] = useState({
    title: "",
    platform: "youtube" as string,
    type: "video" as string,
    status: "idea" as string,
    pillar: "",
    url: "",
    notes: "",
  });

  // -----------------------------------------------------------------------
  // Products state
  // -----------------------------------------------------------------------
  const [productPage, setProductPage] = useState(1);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    type: "source_code" as string,
    category: "",
    price: 0,
    currency: "USD",
    status: "planned" as string,
    description: "",
    gumroad_url: "",
    github_url: "",
  });

  // -----------------------------------------------------------------------
  // Revenue state
  // -----------------------------------------------------------------------
  const [revenuePage, setRevenuePage] = useState(1);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueForm, setRevenueForm] = useState({
    stream: "project" as string,
    amount: 0,
    currency: "USD",
    description: "",
    payment_method: "mobile_money" as string,
    payment_date: "",
    contact_id: 0,
  });

  // -----------------------------------------------------------------------
  // Daily Ops state
  // -----------------------------------------------------------------------
  const [logPage, setLogPage] = useState(1);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    emails_sent: 0,
    emails_received: 0,
    prospects_found: 0,
    students_enrolled: 0,
    courses_created: 0,
    revenue_today: 0,
    notes: "",
  });

  // -----------------------------------------------------------------------
  // Websites state
  // -----------------------------------------------------------------------
  const [websiteSiteFilter, setWebsiteSiteFilter] = useState("");
  const [websitePage, setWebsitePage] = useState(1);
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [websiteForm, setWebsiteForm] = useState({
    site: "desishub" as string,
    type: "blog_post" as string,
    title: "",
    description: "",
    status: "planned" as string,
    seo_score: 0,
  });

  // -----------------------------------------------------------------------
  // Data hooks
  // -----------------------------------------------------------------------
  const { data: dashboard, isLoading: loadingDashboard } = useAtlasDashboard();

  // Contacts
  const { data: contactsData, isLoading: loadingContacts } = useAtlasContacts(contactPage, {
    type: contactTypeFilter || undefined,
    status: contactStatusFilter || undefined,
    source: contactSourceFilter || undefined,
    search: contactSearch || undefined,
  });
  const contacts = contactsData?.data ?? [];
  const contactsMeta = contactsData?.meta;
  const { mutate: createContact } = useCreateAtlasContact();
  const { mutate: updateContact } = useUpdateAtlasContact();
  const { mutate: deleteContact } = useDeleteAtlasContact();

  // Projects
  const { data: projectsData, isLoading: loadingProjects } = useAtlasProjects(projectPage);
  const projects = projectsData?.data ?? [];
  const projectsMeta = projectsData?.meta;
  const { mutate: createProject } = useCreateAtlasProject();

  // Courses
  const { data: coursesData, isLoading: loadingCourses } = useAtlasCourses(coursePage);
  const courses = coursesData?.data ?? [];
  const coursesMeta = coursesData?.meta;
  const { mutate: createCourse } = useCreateAtlasCourse();

  // Agents
  const { data: agentsData, isLoading: loadingAgents } = useAtlasAgentClients(agentPage);
  const agents = agentsData?.data ?? [];
  const agentsMeta = agentsData?.meta;
  const { mutate: createAgent } = useCreateAtlasAgentClient();
  const { data: agentRevenue } = useAtlasAgentRevenue();

  // Content
  const { data: contentData, isLoading: loadingContent } = useAtlasContent(contentPage, {
    platform: contentPlatformFilter || undefined,
  });
  const contentItems = contentData?.data ?? [];
  const contentMeta = contentData?.meta;
  const { mutate: createContent } = useCreateAtlasContent();

  // Products
  const { data: productsData, isLoading: loadingProducts } = useAtlasProducts(productPage);
  const productItems = productsData?.data ?? [];
  const productsMeta = productsData?.meta;
  const { mutate: createProduct } = useCreateAtlasProduct();

  // Revenue
  const { data: revenueData, isLoading: loadingRevenue } = useAtlasRevenue(revenuePage);
  const revenueItems = revenueData?.data ?? [];
  const revenueMeta = revenueData?.meta;
  const { mutate: createRevenue } = useCreateAtlasRevenue();
  const { data: revenueByStream } = useAtlasRevenueByStream();
  const { data: weeklyRevenue } = useAtlasWeeklyRevenue();
  const { data: monthlyRevenue } = useAtlasMonthlyRevenue();
  const { data: mrrData } = useAtlasMRR();

  // Daily Ops
  const { data: logsData, isLoading: loadingLogs } = useAtlasDailyLogs(logPage);
  const logs = logsData?.data ?? [];
  const logsMeta = logsData?.meta;
  const { data: todayLog } = useAtlasTodayLog();
  const { mutate: createLog } = useCreateAtlasLog();
  const { data: streakData } = useAtlasStreak();

  // Websites
  const { data: websitesData, isLoading: loadingWebsites } = useAtlasWebsiteTasks(websitePage, {
    site: websiteSiteFilter || undefined,
  });
  const websiteTasks = websitesData?.data ?? [];
  const websitesMeta = websitesData?.meta;
  const { mutate: createWebsiteTask } = useCreateAtlasWebsiteTask();

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleCreateContact = () => {
    createContact(contactForm as unknown as Partial<AtlasContact>, {
      onSuccess: () => {
        setShowContactModal(false);
        setContactForm({ name: "", email: "", phone: "", company: "", role: "", location: "", source: "website", type: "prospect", status: "new", icp_profile: "C", deal_value: 0, currency: "USD", notes: "" });
      },
    });
  };

  const handleDeleteContact = async (id: number) => {
    const ok = await confirm({
      title: "Delete Contact",
      description: "Delete this contact? This cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (ok) deleteContact(id);
  };

  const handleCreateProject = () => {
    createProject(projectForm as unknown as Partial<AtlasProject>, {
      onSuccess: () => {
        setShowProjectModal(false);
        setProjectForm({ name: "", description: "", contact_id: 0, status: "discovery", stage: "lead", deal_value: 0, currency: "USD", deadline: "" });
      },
    });
  };

  const handleCreateCourse = () => {
    createCourse(courseForm as unknown as Partial<AtlasCourse>, {
      onSuccess: () => {
        setShowCourseModal(false);
        setCourseForm({ title: "", description: "", pillar: "", duration: "", price: 0, currency: "USD", status: "planned", gumroad_url: "" });
      },
    });
  };

  const handleCreateAgent = () => {
    createAgent(agentForm as unknown as Partial<AtlasAgentClient>, {
      onSuccess: () => {
        setShowAgentModal(false);
        setAgentForm({ contact_id: 0, career: "", tier: "basic", setup_fee: 0, monthly_fee: 0, currency: "USD", status: "discovery", notes: "" });
      },
    });
  };

  const handleCreateContent = () => {
    createContent(contentForm as unknown as Partial<AtlasContent>, {
      onSuccess: () => {
        setShowContentModal(false);
        setContentForm({ title: "", platform: "youtube", type: "video", status: "idea", pillar: "", url: "", notes: "" });
      },
    });
  };

  const handleCreateProduct = () => {
    createProduct(productForm as unknown as Partial<AtlasProduct>, {
      onSuccess: () => {
        setShowProductModal(false);
        setProductForm({ name: "", type: "source_code", category: "", price: 0, currency: "USD", status: "planned", description: "", gumroad_url: "", github_url: "" });
      },
    });
  };

  const handleCreateRevenue = () => {
    createRevenue(revenueForm as unknown as Partial<AtlasRevenueEntry>, {
      onSuccess: () => {
        setShowRevenueModal(false);
        setRevenueForm({ stream: "project", amount: 0, currency: "USD", description: "", payment_method: "mobile_money", payment_date: "", contact_id: 0 });
      },
    });
  };

  const handleCreateLog = () => {
    createLog(logForm as unknown as Partial<AtlasDailyLog>, {
      onSuccess: () => {
        setShowLogModal(false);
        setLogForm({ emails_sent: 0, emails_received: 0, prospects_found: 0, students_enrolled: 0, courses_created: 0, revenue_today: 0, notes: "" });
      },
    });
  };

  const handleCreateWebsiteTask = () => {
    createWebsiteTask(websiteForm as unknown as Partial<AtlasWebsiteTask>, {
      onSuccess: () => {
        setShowWebsiteModal(false);
        setWebsiteForm({ site: "desishub", type: "blog_post", title: "", description: "", status: "planned", seo_score: 0 });
      },
    });
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ATLAS CRM</h1>
          <p className="text-sm text-text-muted mt-1">Your personal business operating system</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-px">
        {MAIN_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-accent text-accent"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* DASHBOARD TAB                                                     */}
      {/* ================================================================= */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {loadingDashboard ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : dashboard ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Contacts", value: dashboard.contacts, icon: Users },
                  { label: "Monthly Revenue", value: formatMoney(dashboard.monthly_revenue), icon: DollarSign },
                  { label: "Weekly Revenue", value: formatMoney(dashboard.weekly_revenue), icon: TrendingUp },
                  { label: "MRR", value: formatMoney(dashboard.mrr), icon: DollarSign },
                  { label: "Active Projects", value: dashboard.active_projects, icon: Briefcase },
                  { label: "Followups Due", value: dashboard.followups_due, icon: Clock },
                  { label: "Today's Interactions", value: dashboard.today_interactions, icon: CalendarCheck },
                  { label: "Total Students", value: dashboard.total_students, icon: BookOpen },
                ].map((kpi) => {
                  const KIcon = kpi.icon;
                  return (
                    <div key={kpi.label} className="rounded-xl border border-border bg-bg-secondary p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-muted">{kpi.label}</span>
                        <KIcon className="h-4 w-4 text-text-muted" />
                      </div>
                      <p className="mt-2 text-2xl font-bold text-foreground">{kpi.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Pipeline Summary */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">Contact Pipeline</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {[
                    { label: "New", value: dashboard.pipeline.new, color: "text-blue-400" },
                    { label: "Contacted", value: dashboard.pipeline.contacted, color: "text-yellow-400" },
                    { label: "Proposal Sent", value: dashboard.pipeline.proposal_sent, color: "text-orange-400" },
                    { label: "Won", value: dashboard.pipeline.won, color: "text-green-400" },
                    { label: "Lost", value: dashboard.pipeline.lost, color: "text-red-400" },
                  ].map((stage) => (
                    <div key={stage.label} className="rounded-xl border border-border bg-bg-secondary p-4 text-center">
                      <p className={`text-2xl font-bold ${stage.color}`}>{stage.value}</p>
                      <p className="text-sm text-text-muted mt-1">{stage.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ================================================================= */}
      {/* CONTACTS TAB                                                      */}
      {/* ================================================================= */}
      {activeTab === "contacts" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={contactSearch}
                onChange={(e) => { setContactSearch(e.target.value); setContactPage(1); }}
                className="w-full rounded-lg border border-border bg-bg-secondary pl-10 pr-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <select value={contactTypeFilter} onChange={(e) => { setContactTypeFilter(e.target.value); setContactPage(1); }} className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
              {CONTACT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={contactStatusFilter} onChange={(e) => { setContactStatusFilter(e.target.value); setContactPage(1); }} className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
              {CONTACT_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={contactSourceFilter} onChange={(e) => { setContactSourceFilter(e.target.value); setContactPage(1); }} className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
              {SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={() => setShowContactModal(true)} className="bg-accent px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Contact
            </button>
          </div>

          {/* Table */}
          {loadingContacts ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary text-left">
                    <th className="px-4 py-3 font-medium text-text-muted">Name</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Company</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Type</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Status</th>
                    <th className="px-4 py-3 font-medium text-text-muted">ICP</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Deal Value</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Last Contacted</th>
                    <th className="px-4 py-3 font-medium text-text-muted"></th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.id} className="border-b border-border hover:bg-bg-elevated transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/atlas/contacts/${c.id}`} className="font-medium text-accent hover:underline">{c.name}</Link>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{c.company || "—"}</td>
                      <td className="px-4 py-3"><span className="capitalize text-text-secondary">{c.type.replace("_", " ")}</span></td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${contactStatusBadge[c.status] || ""}`}>{c.status.replace("_", " ")}</span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{c.icp_profile}</td>
                      <td className="px-4 py-3 text-text-secondary">{c.deal_value ? formatMoney(c.deal_value, c.currency) : "—"}</td>
                      <td className="px-4 py-3 text-text-muted">{formatDate(c.last_contacted_at)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeleteContact(c.id)} className="text-text-muted hover:text-red-400 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {contacts.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-text-muted">No contacts found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {contactsMeta && (
            <Pagination page={contactsMeta.page} pages={contactsMeta.pages} onPrev={() => setContactPage((p) => Math.max(1, p - 1))} onNext={() => setContactPage((p) => Math.min(contactsMeta.pages, p + 1))} />
          )}

          {/* Contact Modal */}
          {showContactModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-lg rounded-xl border border-border bg-bg-elevated p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-semibold text-foreground mb-4">New Contact</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                    <input value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                      <input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Phone</label>
                      <input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Company</label>
                      <input value={contactForm.company} onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
                      <input value={contactForm.role} onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Location</label>
                    <input value={contactForm.location} onChange={(e) => setContactForm({ ...contactForm, location: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Source</label>
                      <select value={contactForm.source} onChange={(e) => setContactForm({ ...contactForm, source: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                        {SOURCE_OPTIONS.filter((o) => o.value).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
                      <select value={contactForm.type} onChange={(e) => setContactForm({ ...contactForm, type: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                        {CONTACT_TYPE_OPTIONS.filter((o) => o.value).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                      <select value={contactForm.status} onChange={(e) => setContactForm({ ...contactForm, status: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                        {CONTACT_STATUS_OPTIONS.filter((o) => o.value).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">ICP Profile</label>
                      <select value={contactForm.icp_profile} onChange={(e) => setContactForm({ ...contactForm, icp_profile: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                        {ICP_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Deal Value</label>
                      <input type="number" value={contactForm.deal_value} onChange={(e) => setContactForm({ ...contactForm, deal_value: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Currency</label>
                      <input value={contactForm.currency} onChange={(e) => setContactForm({ ...contactForm, currency: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
                    <textarea value={contactForm.notes} onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })} rows={3} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button onClick={() => setShowContactModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-elevated rounded-lg">Cancel</button>
                  <button onClick={handleCreateContact} className="bg-accent px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-accent/90">Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* PROJECTS TAB                                                      */}
      {/* ================================================================= */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Projects</h2>
            <button onClick={() => setShowProjectModal(true)} className="bg-accent px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Project
            </button>
          </div>

          {loadingProjects ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary text-left">
                    <th className="px-4 py-3 font-medium text-text-muted">Name</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Client</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Stage</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Deal Value</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Deadline</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id} className="border-b border-border hover:bg-bg-elevated transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{p.contact?.name || "—"}</td>
                      <td className="px-4 py-3"><span className="capitalize text-text-secondary">{p.stage}</span></td>
                      <td className="px-4 py-3 text-text-secondary">{formatMoney(p.deal_value, p.currency)}</td>
                      <td className="px-4 py-3 text-text-muted">{formatDate(p.deadline)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${projectStatusBadge[p.status] || ""}`}>{p.status.replace("_", " ")}</span>
                      </td>
                    </tr>
                  ))}
                  {projects.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No projects found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {projectsMeta && (
            <Pagination page={projectsMeta.page} pages={projectsMeta.pages} onPrev={() => setProjectPage((p) => Math.max(1, p - 1))} onNext={() => setProjectPage((p) => Math.min(projectsMeta.pages, p + 1))} />
          )}

          {/* Project Modal */}
          {showProjectModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-lg rounded-xl border border-border bg-bg-elevated p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-semibold text-foreground mb-4">New Project</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                    <input value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                    <textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} rows={3} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                      <select value={projectForm.status} onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                        {["discovery", "proposal_sent", "negotiation", "won", "in_progress", "delivered", "invoiced", "paid", "lost"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Stage</label>
                      <select value={projectForm.stage} onChange={(e) => setProjectForm({ ...projectForm, stage: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                        {["lead", "qualified", "proposal", "closing", "won", "lost"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Deal Value</label>
                      <input type="number" value={projectForm.deal_value} onChange={(e) => setProjectForm({ ...projectForm, deal_value: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Deadline</label>
                      <input type="date" value={projectForm.deadline} onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button onClick={() => setShowProjectModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover rounded-lg">Cancel</button>
                  <button onClick={handleCreateProject} className="bg-accent px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-accent/90">Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* COURSES TAB                                                       */}
      {/* ================================================================= */}
      {activeTab === "courses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Courses</h2>
            <button onClick={() => setShowCourseModal(true)} className="bg-accent px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Course
            </button>
          </div>

          {loadingCourses ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary text-left">
                    <th className="px-4 py-3 font-medium text-text-muted">Title</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Pillar</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Duration</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Price</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Status</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Students</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id} className="border-b border-border hover:bg-bg-elevated transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{c.title}</td>
                      <td className="px-4 py-3 text-text-secondary">{c.pillar || "—"}</td>
                      <td className="px-4 py-3 text-text-secondary">{c.duration || "—"}</td>
                      <td className="px-4 py-3 text-text-secondary">{formatMoney(c.price, c.currency)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${productStatusBadge[c.status] || ""}`}>{c.status}</span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{c.total_students}</td>
                    </tr>
                  ))}
                  {courses.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No courses found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {coursesMeta && (
            <Pagination page={coursesMeta.page} pages={coursesMeta.pages} onPrev={() => setCoursePage((p) => Math.max(1, p - 1))} onNext={() => setCoursePage((p) => Math.min(coursesMeta.pages, p + 1))} />
          )}

          {/* Course Modal */}
          {showCourseModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-lg rounded-xl border border-border bg-bg-elevated p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-semibold text-foreground mb-4">New Course</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
                    <input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                    <textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} rows={3} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Pillar</label>
                      <input value={courseForm.pillar} onChange={(e) => setCourseForm({ ...courseForm, pillar: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Duration</label>
                      <input value={courseForm.duration} onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })} placeholder="e.g. 4 weeks" className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Price</label>
                      <input type="number" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Currency</label>
                      <input value={courseForm.currency} onChange={(e) => setCourseForm({ ...courseForm, currency: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                      <select value={courseForm.status} onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                        {["planned", "building", "published", "archived"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Gumroad URL</label>
                    <input value={courseForm.gumroad_url} onChange={(e) => setCourseForm({ ...courseForm, gumroad_url: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button onClick={() => setShowCourseModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover rounded-lg">Cancel</button>
                  <button onClick={handleCreateCourse} className="bg-accent px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-accent/90">Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* AGENTS TAB                                                        */}
      {/* ================================================================= */}
      {activeTab === "agents" && (
        <div className="space-y-4">
          {/* MRR Summary */}
          {agentRevenue && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-bg-secondary p-4">
                <span className="text-sm text-text-muted">MRR</span>
                <p className="mt-1 text-2xl font-bold text-foreground">{formatMoney(agentRevenue.mrr)}</p>
              </div>
              <div className="rounded-xl border border-border bg-bg-secondary p-4">
                <span className="text-sm text-text-muted">ARR</span>
                <p className="mt-1 text-2xl font-bold text-foreground">{formatMoney(agentRevenue.arr)}</p>
              </div>
              <div className="rounded-xl border border-border bg-bg-secondary p-4">
                <span className="text-sm text-text-muted">Total Setup Fees</span>
                <p className="mt-1 text-2xl font-bold text-foreground">{formatMoney(agentRevenue.total_setup)}</p>
              </div>
              <div className="rounded-xl border border-border bg-bg-secondary p-4">
                <span className="text-sm text-text-muted">Active / Total</span>
                <p className="mt-1 text-2xl font-bold text-foreground">{agentRevenue.active_count} / {agentRevenue.total_count}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Agent Clients</h2>
            <button onClick={() => setShowAgentModal(true)} className="bg-accent px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Agent Client
            </button>
          </div>

          {loadingAgents ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary text-left">
                    <th className="px-4 py-3 font-medium text-text-muted">Contact</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Career</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Tier</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Monthly Fee</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Status</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Next Maintenance</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((a) => (
                    <tr key={a.id} className="border-b border-border hover:bg-bg-elevated transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{a.contact?.name || "—"}</td>
                      <td className="px-4 py-3 text-text-secondary">{a.career || "—"}</td>
                      <td className="px-4 py-3"><span className="capitalize text-text-secondary">{a.tier}</span></td>
                      <td className="px-4 py-3 text-text-secondary">{formatMoney(a.monthly_fee, a.currency)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${agentStatusBadge[a.status] || ""}`}>{a.status}</span>
                      </td>
                      <td className="px-4 py-3 text-text-muted">{formatDate(a.next_maintenance)}</td>
                    </tr>
                  ))}
                  {agents.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No agent clients found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {agentsMeta && (
            <Pagination page={agentsMeta.page} pages={agentsMeta.pages} onPrev={() => setAgentPage((p) => Math.max(1, p - 1))} onNext={() => setAgentPage((p) => Math.min(agentsMeta.pages, p + 1))} />
          )}

          {/* Agent Modal */}
          {showAgentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-lg rounded-xl border border-border bg-bg-elevated p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-semibold text-foreground mb-4">New Agent Client</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Career</label>
                    <input value={agentForm.career} onChange={(e) => setAgentForm({ ...agentForm, career: e.target.value })} placeholder="e.g. Real Estate Agent" className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Tier</label>
                      <select value={agentForm.tier} onChange={(e) => setAgentForm({ ...agentForm, tier: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                        {["basic", "pro", "enterprise"].map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                      <select value={agentForm.status} onChange={(e) => setAgentForm({ ...agentForm, status: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                        {["discovery", "proposal", "building", "delivered", "active", "churned"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Setup Fee</label>
                      <input type="number" value={agentForm.setup_fee} onChange={(e) => setAgentForm({ ...agentForm, setup_fee: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Monthly Fee</label>
                      <input type="number" value={agentForm.monthly_fee} onChange={(e) => setAgentForm({ ...agentForm, monthly_fee: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Currency</label>
                      <input value={agentForm.currency} onChange={(e) => setAgentForm({ ...agentForm, currency: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
                    <textarea value={agentForm.notes} onChange={(e) => setAgentForm({ ...agentForm, notes: e.target.value })} rows={3} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button onClick={() => setShowAgentModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover rounded-lg">Cancel</button>
                  <button onClick={handleCreateAgent} className="bg-accent px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-accent/90">Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* CONTENT TAB                                                       */}
      {/* ================================================================= */}
      {activeTab === "content" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-foreground">Content</h2>
              <select value={contentPlatformFilter} onChange={(e) => { setContentPlatformFilter(e.target.value); setContentPage(1); }} className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                <option value="">All Platforms</option>
                <option value="youtube">YouTube</option>
                <option value="linkedin">LinkedIn</option>
                <option value="tiktok">TikTok</option>
                <option value="blog">Blog</option>
              </select>
            </div>
            <button onClick={() => setShowContentModal(true)} className="bg-accent px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Content
            </button>
          </div>

          {loadingContent ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary text-left">
                    <th className="px-4 py-3 font-medium text-text-muted">Title</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Platform</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Type</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Status</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Views</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Likes</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {contentItems.map((c) => (
                    <tr key={c.id} className="border-b border-border hover:bg-bg-elevated transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{c.title}</td>
                      <td className="px-4 py-3"><span className="capitalize text-text-secondary">{c.platform}</span></td>
                      <td className="px-4 py-3"><span className="capitalize text-text-secondary">{c.type}</span></td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${contentStatusBadge[c.status] || ""}`}>{c.status}</span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{c.views.toLocaleString()}</td>
                      <td className="px-4 py-3 text-text-secondary">{c.likes.toLocaleString()}</td>
                      <td className="px-4 py-3 text-text-secondary">{c.revenue_generated ? formatMoney(c.revenue_generated) : "—"}</td>
                    </tr>
                  ))}
                  {contentItems.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">No content found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {contentMeta && (
            <Pagination page={contentMeta.page} pages={contentMeta.pages} onPrev={() => setContentPage((p) => Math.max(1, p - 1))} onNext={() => setContentPage((p) => Math.min(contentMeta.pages, p + 1))} />
          )}

          {/* Content Modal */}
          {showContentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-lg rounded-xl border border-border bg-bg-elevated p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-semibold text-foreground mb-4">New Content</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
                    <input value={contentForm.title} onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Platform</label>
                      <select value={contentForm.platform} onChange={(e) => setContentForm({ ...contentForm, platform: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                        {["youtube", "linkedin", "tiktok", "blog"].map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
                      <select value={contentForm.type} onChange={(e) => setContentForm({ ...contentForm, type: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                        {["video", "post", "carousel", "article", "reel", "short"].map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                      <select value={contentForm.status} onChange={(e) => setContentForm({ ...contentForm, status: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                        {["idea", "scripted", "recording", "editing", "published", "archived"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Pillar</label>
                    <input value={contentForm.pillar} onChange={(e) => setContentForm({ ...contentForm, pillar: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">URL</label>
                    <input value={contentForm.url} onChange={(e) => setContentForm({ ...contentForm, url: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
                    <textarea value={contentForm.notes} onChange={(e) => setContentForm({ ...contentForm, notes: e.target.value })} rows={3} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button onClick={() => setShowContentModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover rounded-lg">Cancel</button>
                  <button onClick={handleCreateContent} className="bg-accent px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-accent/90">Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* PRODUCTS TAB                                                      */}
      {/* ================================================================= */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Products</h2>
            <button onClick={() => setShowProductModal(true)} className="bg-accent px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Product
            </button>
          </div>

          {loadingProducts ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary text-left">
                    <th className="px-4 py-3 font-medium text-text-muted">Name</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Type</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Category</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Price</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Sales</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Revenue</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {productItems.map((p) => (
                    <tr key={p.id} className="border-b border-border hover:bg-bg-elevated transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                      <td className="px-4 py-3"><span className="capitalize text-text-secondary">{p.type.replace("_", " ")}</span></td>
                      <td className="px-4 py-3 text-text-secondary">{p.category || "—"}</td>
                      <td className="px-4 py-3 text-text-secondary">{formatMoney(p.price, p.currency)}</td>
                      <td className="px-4 py-3 text-text-secondary">{p.total_sales}</td>
                      <td className="px-4 py-3 text-text-secondary">{formatMoney(p.total_revenue, p.currency)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${productStatusBadge[p.status] || ""}`}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                  {productItems.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">No products found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {productsMeta && (
            <Pagination page={productsMeta.page} pages={productsMeta.pages} onPrev={() => setProductPage((p) => Math.max(1, p - 1))} onNext={() => setProductPage((p) => Math.min(productsMeta.pages, p + 1))} />
          )}

          {/* Product Modal */}
          {showProductModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-lg rounded-xl border border-border bg-bg-elevated p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-semibold text-foreground mb-4">New Product</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                    <input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
                      <select value={productForm.type} onChange={(e) => setProductForm({ ...productForm, type: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                        {["source_code", "starter_kit", "course", "template", "ebook"].map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
                      <input value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                      <select value={productForm.status} onChange={(e) => setProductForm({ ...productForm, status: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                        {["planned", "building", "published", "archived"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Price</label>
                      <input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Currency</label>
                      <input value={productForm.currency} onChange={(e) => setProductForm({ ...productForm, currency: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                    <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} rows={3} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Gumroad URL</label>
                      <input value={productForm.gumroad_url} onChange={(e) => setProductForm({ ...productForm, gumroad_url: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">GitHub URL</label>
                      <input value={productForm.github_url} onChange={(e) => setProductForm({ ...productForm, github_url: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button onClick={() => setShowProductModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover rounded-lg">Cancel</button>
                  <button onClick={handleCreateProduct} className="bg-accent px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-accent/90">Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* REVENUE TAB                                                       */}
      {/* ================================================================= */}
      {activeTab === "revenue" && (
        <div className="space-y-4">
          {/* Revenue Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-bg-secondary p-4">
              <span className="text-sm text-text-muted">Weekly Revenue</span>
              <p className="mt-1 text-2xl font-bold text-foreground">{weeklyRevenue ? formatMoney(weeklyRevenue.total ?? weeklyRevenue) : "—"}</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-secondary p-4">
              <span className="text-sm text-text-muted">Monthly Revenue</span>
              <p className="mt-1 text-2xl font-bold text-foreground">{monthlyRevenue ? formatMoney(monthlyRevenue.total ?? monthlyRevenue) : "—"}</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-secondary p-4">
              <span className="text-sm text-text-muted">Agent MRR</span>
              <p className="mt-1 text-2xl font-bold text-foreground">{mrrData ? formatMoney(mrrData.agent_mrr) : "—"}</p>
            </div>
          </div>

          {/* Stream Breakdown */}
          {revenueByStream && revenueByStream.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Revenue by Stream</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {revenueByStream.map((s) => (
                  <div key={s.stream} className="rounded-xl border border-border bg-bg-secondary p-4">
                    <p className="text-sm text-text-muted capitalize">{s.stream.replace("_", " ")}</p>
                    <p className="mt-1 text-lg font-bold text-foreground">{formatMoney(s.total)}</p>
                    <p className="text-xs text-text-muted">{s.count} entries</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revenue Table */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent Entries</h2>
            <button onClick={() => setShowRevenueModal(true)} className="bg-accent px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2">
              <Plus className="h-4 w-4" /> Record Revenue
            </button>
          </div>

          {loadingRevenue ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary text-left">
                    <th className="px-4 py-3 font-medium text-text-muted">Date</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Stream</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Description</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Amount</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Method</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueItems.map((r) => (
                    <tr key={r.id} className="border-b border-border hover:bg-bg-elevated transition-colors">
                      <td className="px-4 py-3 text-text-muted">{formatDate(r.payment_date || r.created_at)}</td>
                      <td className="px-4 py-3"><span className="capitalize text-text-secondary">{r.stream.replace("_", " ")}</span></td>
                      <td className="px-4 py-3 text-text-secondary">{r.description || "—"}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{formatMoney(r.amount, r.currency)}</td>
                      <td className="px-4 py-3"><span className="capitalize text-text-secondary">{r.payment_method.replace("_", " ")}</span></td>
                      <td className="px-4 py-3 text-text-secondary">{r.contact?.name || "—"}</td>
                    </tr>
                  ))}
                  {revenueItems.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No revenue entries found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {revenueMeta && (
            <Pagination page={revenueMeta.page} pages={revenueMeta.pages} onPrev={() => setRevenuePage((p) => Math.max(1, p - 1))} onNext={() => setRevenuePage((p) => Math.min(revenueMeta.pages, p + 1))} />
          )}

          {/* Revenue Modal */}
          {showRevenueModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-lg rounded-xl border border-border bg-bg-elevated p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-semibold text-foreground mb-4">Record Revenue</h2>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Stream</label>
                      <select value={revenueForm.stream} onChange={(e) => setRevenueForm({ ...revenueForm, stream: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                        {["project", "dgateway", "course", "source_code", "starter_kit", "agent_setup", "agent_monthly", "training", "consulting"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Payment Method</label>
                      <select value={revenueForm.payment_method} onChange={(e) => setRevenueForm({ ...revenueForm, payment_method: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                        {["mobile_money", "bank_transfer", "stripe", "gumroad", "cash"].map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Amount</label>
                      <input type="number" value={revenueForm.amount} onChange={(e) => setRevenueForm({ ...revenueForm, amount: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Currency</label>
                      <input value={revenueForm.currency} onChange={(e) => setRevenueForm({ ...revenueForm, currency: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                    <input value={revenueForm.description} onChange={(e) => setRevenueForm({ ...revenueForm, description: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Payment Date</label>
                    <input type="date" value={revenueForm.payment_date} onChange={(e) => setRevenueForm({ ...revenueForm, payment_date: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button onClick={() => setShowRevenueModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover rounded-lg">Cancel</button>
                  <button onClick={handleCreateRevenue} className="bg-accent px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-accent/90">Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* DAILY OPS TAB                                                     */}
      {/* ================================================================= */}
      {activeTab === "ops" && (
        <div className="space-y-4">
          {/* Today's Log + Streak */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-bg-secondary p-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarCheck className="h-5 w-5 text-accent" />
                <h3 className="text-sm font-semibold text-foreground">Today&apos;s Log</h3>
              </div>
              {todayLog ? (
                <div className="space-y-1 text-sm text-text-secondary">
                  <p>Emails sent: {todayLog.emails_sent} | Received: {todayLog.emails_received}</p>
                  <p>Prospects found: {todayLog.prospects_found}</p>
                  <p>Students enrolled: {todayLog.students_enrolled}</p>
                  <p>Revenue today: {formatMoney(todayLog.revenue_today)}</p>
                  {todayLog.notes && <p className="text-text-muted mt-2">{todayLog.notes}</p>}
                </div>
              ) : (
                <p className="text-sm text-text-muted">No log for today yet.</p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-bg-secondary p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-5 w-5 text-orange-400" />
                <h3 className="text-sm font-semibold text-foreground">Streak</h3>
              </div>
              <p className="text-4xl font-bold text-foreground">{streakData?.streak ?? 0}</p>
              <p className="text-sm text-text-muted">consecutive days logged</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Activity Logs</h2>
            <button onClick={() => setShowLogModal(true)} className="bg-accent px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2">
              <Plus className="h-4 w-4" /> Log Activity
            </button>
          </div>

          {loadingLogs ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="rounded-xl border border-border bg-bg-secondary p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">{formatDate(log.date)}</span>
                    <span className="text-sm text-text-muted">{formatMoney(log.revenue_today)} revenue</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-text-secondary sm:grid-cols-4">
                    <span>Emails: {log.emails_sent}/{log.emails_received}</span>
                    <span>Prospects: {log.prospects_found}</span>
                    <span>Students: {log.students_enrolled}</span>
                    <span>Courses: {log.courses_created}</span>
                  </div>
                  {log.notes && <p className="mt-2 text-sm text-text-muted">{log.notes}</p>}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="rounded-xl border border-border bg-bg-secondary p-8 text-center text-text-muted">No logs found</div>
              )}
            </div>
          )}

          {logsMeta && (
            <Pagination page={logsMeta.page} pages={logsMeta.pages} onPrev={() => setLogPage((p) => Math.max(1, p - 1))} onNext={() => setLogPage((p) => Math.min(logsMeta.pages, p + 1))} />
          )}

          {/* Log Modal */}
          {showLogModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-lg rounded-xl border border-border bg-bg-elevated p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-semibold text-foreground mb-4">Log Activity</h2>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Emails Sent</label>
                      <input type="number" value={logForm.emails_sent} onChange={(e) => setLogForm({ ...logForm, emails_sent: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Emails Received</label>
                      <input type="number" value={logForm.emails_received} onChange={(e) => setLogForm({ ...logForm, emails_received: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Prospects Found</label>
                      <input type="number" value={logForm.prospects_found} onChange={(e) => setLogForm({ ...logForm, prospects_found: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Students Enrolled</label>
                      <input type="number" value={logForm.students_enrolled} onChange={(e) => setLogForm({ ...logForm, students_enrolled: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Courses Created</label>
                      <input type="number" value={logForm.courses_created} onChange={(e) => setLogForm({ ...logForm, courses_created: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Revenue Today</label>
                      <input type="number" value={logForm.revenue_today} onChange={(e) => setLogForm({ ...logForm, revenue_today: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
                    <textarea value={logForm.notes} onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })} rows={3} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button onClick={() => setShowLogModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover rounded-lg">Cancel</button>
                  <button onClick={handleCreateLog} className="bg-accent px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-accent/90">Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* WEBSITES TAB                                                      */}
      {/* ================================================================= */}
      {activeTab === "websites" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-foreground">Website Tasks</h2>
              <select value={websiteSiteFilter} onChange={(e) => { setWebsiteSiteFilter(e.target.value); setWebsitePage(1); }} className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                <option value="">All Sites</option>
                <option value="desishub">DesiShub</option>
                <option value="portfolio">Portfolio</option>
              </select>
            </div>
            <button onClick={() => setShowWebsiteModal(true)} className="bg-accent px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Task
            </button>
          </div>

          {loadingWebsites ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary text-left">
                    <th className="px-4 py-3 font-medium text-text-muted">Title</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Site</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Type</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Status</th>
                    <th className="px-4 py-3 font-medium text-text-muted">SEO Score</th>
                    <th className="px-4 py-3 font-medium text-text-muted">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {websiteTasks.map((t) => (
                    <tr key={t.id} className="border-b border-border hover:bg-bg-elevated transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{t.title}</td>
                      <td className="px-4 py-3"><span className="capitalize text-text-secondary">{t.site}</span></td>
                      <td className="px-4 py-3"><span className="capitalize text-text-secondary">{t.type.replace("_", " ")}</span></td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${websiteStatusBadge[t.status] || ""}`}>{t.status.replace("_", " ")}</span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{t.seo_score || "—"}</td>
                      <td className="px-4 py-3 text-text-muted">{formatDate(t.publish_date || t.created_at)}</td>
                    </tr>
                  ))}
                  {websiteTasks.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No website tasks found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {websitesMeta && (
            <Pagination page={websitesMeta.page} pages={websitesMeta.pages} onPrev={() => setWebsitePage((p) => Math.max(1, p - 1))} onNext={() => setWebsitePage((p) => Math.min(websitesMeta.pages, p + 1))} />
          )}

          {/* Website Task Modal */}
          {showWebsiteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-lg rounded-xl border border-border bg-bg-elevated p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-semibold text-foreground mb-4">New Website Task</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
                    <input value={websiteForm.title} onChange={(e) => setWebsiteForm({ ...websiteForm, title: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Site</label>
                      <select value={websiteForm.site} onChange={(e) => setWebsiteForm({ ...websiteForm, site: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                        <option value="desishub">DesiShub</option>
                        <option value="portfolio">Portfolio</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
                      <select value={websiteForm.type} onChange={(e) => setWebsiteForm({ ...websiteForm, type: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                        {["blog_post", "seo_audit", "content_update", "bug_fix", "feature"].map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                      <select value={websiteForm.status} onChange={(e) => setWebsiteForm({ ...websiteForm, status: e.target.value })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
                        {["planned", "in_progress", "completed", "pushed"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                    <textarea value={websiteForm.description} onChange={(e) => setWebsiteForm({ ...websiteForm, description: e.target.value })} rows={3} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">SEO Score</label>
                    <input type="number" min={0} max={100} value={websiteForm.seo_score} onChange={(e) => setWebsiteForm({ ...websiteForm, seo_score: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button onClick={() => setShowWebsiteModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover rounded-lg">Cancel</button>
                  <button onClick={handleCreateWebsiteTask} className="bg-accent px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-accent/90">Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
