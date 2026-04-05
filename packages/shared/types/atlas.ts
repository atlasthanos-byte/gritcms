// ============================================================
// ATLAS CRM Types
// ============================================================

// --- Contacts ---

export type AtlasContactType = "prospect" | "client" | "student" | "agent_client" | "partner";
export type AtlasContactStatus = "new" | "contacted" | "replied" | "call_booked" | "proposal_sent" | "won" | "lost" | "churned";
export type AtlasSource = "youtube" | "linkedin" | "tiktok" | "referral" | "cold_outreach" | "website" | "gumroad";
export type AtlasICPProfile = "A" | "B" | "C" | "D" | "E" | "F";

export interface AtlasContact {
  id: number;
  tenant_id: number;
  name: string;
  email: string;
  phone: string;
  linkedin_url: string;
  company: string;
  role: string;
  location: string;
  source: AtlasSource;
  type: AtlasContactType;
  status: AtlasContactStatus;
  icp_profile: AtlasICPProfile;
  anti_icp_flags: Record<string, boolean> | null;
  notes: string;
  tags: string[] | null;
  last_contacted_at: string | null;
  next_followup_at: string | null;
  deal_value: number;
  currency: string;
  created_at: string;
  updated_at: string;
  interactions?: AtlasInteraction[];
  projects?: AtlasProject[];
  interaction_count?: number;
  project_count?: number;
}

// --- Interactions ---

export type AtlasInteractionType = "email_sent" | "email_received" | "call" | "meeting" | "linkedin_dm" | "whatsapp" | "note";
export type AtlasChannel = "gmail" | "linkedin" | "whatsapp" | "zoom" | "in_person";
export type AtlasDirection = "inbound" | "outbound";

export interface AtlasInteraction {
  id: number;
  tenant_id: number;
  contact_id: number;
  type: AtlasInteractionType;
  channel: AtlasChannel;
  subject: string;
  body: string;
  direction: AtlasDirection;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  contact?: AtlasContact;
}

// --- Projects ---

export type AtlasProjectStatus = "discovery" | "proposal_sent" | "negotiation" | "won" | "in_progress" | "delivered" | "invoiced" | "paid" | "lost";
export type AtlasProjectStage = "lead" | "qualified" | "proposal" | "closing" | "won" | "lost";

export interface AtlasProject {
  id: number;
  tenant_id: number;
  contact_id: number | null;
  name: string;
  description: string;
  status: AtlasProjectStatus;
  stage: AtlasProjectStage;
  deal_value: number;
  currency: string;
  upfront_percentage: number;
  upfront_paid: boolean;
  final_paid: boolean;
  tech_stack: string[] | null;
  start_date: string | null;
  deadline: string | null;
  delivered_date: string | null;
  contract_signed: boolean;
  contract_url: string;
  proposal_url: string;
  repo_url: string;
  notes: string;
  created_at: string;
  updated_at: string;
  contact?: AtlasContact;
}

// --- Courses ---

export type AtlasCourseStatus = "planned" | "building" | "published" | "archived";
export type AtlasEnrollmentStatus = "enrolled" | "in_progress" | "completed" | "refunded";
export type AtlasPaymentStatus = "pending" | "paid" | "refunded";

export interface AtlasCourse {
  id: number;
  tenant_id: number;
  title: string;
  slug: string;
  description: string;
  pillar: string;
  duration: string;
  price: number;
  currency: string;
  gumroad_url: string;
  youtube_url: string;
  status: AtlasCourseStatus;
  modules: Array<{ title: string; duration: string }> | null;
  total_students: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  enrollments?: AtlasEnrollment[];
}

export interface AtlasEnrollment {
  id: number;
  tenant_id: number;
  course_id: number;
  contact_id: number;
  status: AtlasEnrollmentStatus;
  payment_status: AtlasPaymentStatus;
  amount_paid: number;
  enrolled_at: string;
  completed_at: string | null;
  course?: AtlasCourse;
  contact?: AtlasContact;
}

// --- AI Agent Clients ---

export type AtlasAgentTier = "basic" | "pro" | "enterprise";
export type AtlasAgentStatus = "discovery" | "proposal" | "building" | "delivered" | "active" | "churned";

export interface AtlasAgentClient {
  id: number;
  tenant_id: number;
  contact_id: number | null;
  career: string;
  tier: AtlasAgentTier;
  setup_fee: number;
  monthly_fee: number;
  currency: string;
  status: AtlasAgentStatus;
  repo_url: string;
  skills_count: number;
  tools_connected: string[] | null;
  delivery_date: string | null;
  last_maintenance: string | null;
  next_maintenance: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  contact?: AtlasContact;
}

// --- Content ---

export type AtlasPlatform = "youtube" | "linkedin" | "tiktok" | "blog";
export type AtlasContentType = "video" | "post" | "carousel" | "article" | "reel" | "short";
export type AtlasContentStatus = "idea" | "scripted" | "recording" | "editing" | "published" | "archived";

export interface AtlasContent {
  id: number;
  tenant_id: number;
  platform: AtlasPlatform;
  type: AtlasContentType;
  title: string;
  url: string;
  status: AtlasContentStatus;
  pillar: string;
  publish_date: string | null;
  thumbnail_path: string;
  views: number;
  likes: number;
  comments: number;
  engagement_ratio: number;
  product_tie_in: string;
  course_tie_in: number | null;
  source_code_url: string;
  revenue_generated: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

// --- Digital Products ---

export type AtlasProductType = "source_code" | "starter_kit" | "course" | "template" | "ebook";
export type AtlasProductStatus = "planned" | "building" | "published" | "archived";

export interface AtlasProduct {
  id: number;
  tenant_id: number;
  name: string;
  type: AtlasProductType;
  category: string;
  price: number;
  currency: string;
  gumroad_url: string;
  github_url: string;
  status: AtlasProductStatus;
  total_sales: number;
  total_revenue: number;
  rating: number;
  description: string;
  tech_stack: string[] | null;
  youtube_video_id: number | null;
  created_at: string;
  updated_at: string;
}

// --- Revenue ---

export type AtlasRevenueStream = "project" | "dgateway" | "course" | "source_code" | "starter_kit" | "agent_setup" | "agent_monthly" | "training" | "consulting";
export type AtlasPaymentMethod = "mobile_money" | "bank_transfer" | "stripe" | "gumroad" | "cash";

export interface AtlasRevenueEntry {
  id: number;
  tenant_id: number;
  stream: AtlasRevenueStream;
  source_id: number | null;
  source_type: string;
  amount: number;
  currency: string;
  description: string;
  payment_method: AtlasPaymentMethod;
  payment_date: string | null;
  invoice_number: string;
  contact_id: number | null;
  created_at: string;
  contact?: AtlasContact;
}

// --- Daily Ops ---

export interface AtlasDailyLog {
  id: number;
  tenant_id: number;
  date: string;
  morning_brief: Record<string, unknown> | null;
  eod_review: Record<string, unknown> | null;
  emails_sent: number;
  emails_received: number;
  prospects_found: number;
  students_enrolled: number;
  content_published: Array<{ platform: string; title: string; url: string }> | null;
  courses_created: number;
  revenue_today: number;
  commands_run: string[] | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

// --- Website Maintenance ---

export type AtlasWebSite = "desishub" | "portfolio";
export type AtlasWebTaskType = "blog_post" | "seo_audit" | "content_update" | "bug_fix" | "feature";
export type AtlasWebTaskStatus = "planned" | "in_progress" | "completed" | "pushed";

export interface AtlasWebsiteTask {
  id: number;
  tenant_id: number;
  site: AtlasWebSite;
  type: AtlasWebTaskType;
  title: string;
  description: string;
  status: AtlasWebTaskStatus;
  file_path: string;
  commit_hash: string;
  seo_score: number;
  publish_date: string | null;
  created_at: string;
  updated_at: string;
}

// --- Dashboard ---

export interface AtlasDashboard {
  contacts: number;
  projects: number;
  agent_clients: number;
  content_pieces: number;
  products: number;
  total_students: number;
  monthly_revenue: number;
  weekly_revenue: number;
  mrr: number;
  today_interactions: number;
  followups_due: number;
  active_projects: number;
  pipeline: {
    new: number;
    contacted: number;
    proposal_sent: number;
    won: number;
    lost: number;
  };
}
