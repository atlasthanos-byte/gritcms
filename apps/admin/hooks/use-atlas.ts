import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type {
  AtlasContact,
  AtlasInteraction,
  AtlasProject,
  AtlasCourse,
  AtlasEnrollment,
  AtlasAgentClient,
  AtlasContent,
  AtlasProduct,
  AtlasRevenueEntry,
  AtlasDailyLog,
  AtlasWebsiteTask,
  AtlasDashboard,
} from "@repo/shared/types";

// ============================================================
// Dashboard
// ============================================================

export function useAtlasDashboard() {
  return useQuery({
    queryKey: ["atlas-dashboard"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/atlas/dashboard");
      return data.data as AtlasDashboard;
    },
  });
}

// ============================================================
// Contacts
// ============================================================

export function useAtlasContacts(page = 1, filters: { type?: string; status?: string; icp_profile?: string; source?: string; search?: string } = {}) {
  return useQuery({
    queryKey: ["atlas-contacts", { page, ...filters }],
    queryFn: async () => {
      const sp = new URLSearchParams({ page: String(page) });
      if (filters.type) sp.set("type", filters.type);
      if (filters.status) sp.set("status", filters.status);
      if (filters.icp_profile) sp.set("icp_profile", filters.icp_profile);
      if (filters.source) sp.set("source", filters.source);
      if (filters.search) sp.set("search", filters.search);
      const { data } = await apiClient.get(`/api/atlas/contacts?${sp}`);
      return data as { data: AtlasContact[]; meta: { total: number; page: number; page_size: number; pages: number } };
    },
  });
}

export function useAtlasContact(id: number) {
  return useQuery({
    queryKey: ["atlas-contacts", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/atlas/contacts/${id}`);
      return data.data as AtlasContact;
    },
    enabled: id > 0,
  });
}

export function useCreateAtlasContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<AtlasContact>) => {
      const { data } = await apiClient.post("/api/atlas/contacts", body);
      return data.data as AtlasContact;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atlas-contacts"] });
      qc.invalidateQueries({ queryKey: ["atlas-dashboard"] });
      toast.success("Contact created");
    },
    onError: () => toast.error("Failed to create contact"),
  });
}

export function useUpdateAtlasContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<AtlasContact> & { id: number }) => {
      const { data } = await apiClient.put(`/api/atlas/contacts/${id}`, body);
      return data.data as AtlasContact;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atlas-contacts"] });
      qc.invalidateQueries({ queryKey: ["atlas-dashboard"] });
      toast.success("Contact updated");
    },
    onError: () => toast.error("Failed to update contact"),
  });
}

export function useDeleteAtlasContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/atlas/contacts/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atlas-contacts"] });
      qc.invalidateQueries({ queryKey: ["atlas-dashboard"] });
      toast.success("Contact deleted");
    },
    onError: () => toast.error("Failed to delete contact"),
  });
}

export function useAtlasColdLeads(days = 5) {
  return useQuery({
    queryKey: ["atlas-cold-leads", days],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/atlas/contacts/cold-leads?days=${days}`);
      return data.data as AtlasContact[];
    },
  });
}

export function useAtlasPipeline() {
  return useQuery({
    queryKey: ["atlas-pipeline"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/atlas/contacts/pipeline");
      return data.data as Array<{ status: string; count: number; items: AtlasContact[] }>;
    },
  });
}

export function useAtlasFollowups() {
  return useQuery({
    queryKey: ["atlas-followups"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/atlas/contacts/followups");
      return data.data as AtlasContact[];
    },
  });
}

// ============================================================
// Interactions
// ============================================================

export function useAtlasInteractions(page = 1, filters: { type?: string; channel?: string } = {}) {
  return useQuery({
    queryKey: ["atlas-interactions", { page, ...filters }],
    queryFn: async () => {
      const sp = new URLSearchParams({ page: String(page) });
      if (filters.type) sp.set("type", filters.type);
      if (filters.channel) sp.set("channel", filters.channel);
      const { data } = await apiClient.get(`/api/atlas/interactions?${sp}`);
      return data as { data: AtlasInteraction[]; meta: { total: number; page: number; page_size: number; pages: number } };
    },
  });
}

export function useAtlasContactInteractions(contactId: number) {
  return useQuery({
    queryKey: ["atlas-contact-interactions", contactId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/atlas/contacts/${contactId}/interactions`);
      return data.data as AtlasInteraction[];
    },
    enabled: contactId > 0,
  });
}

export function useCreateAtlasInteraction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<AtlasInteraction>) => {
      const { data } = await apiClient.post("/api/atlas/interactions", body);
      return data.data as AtlasInteraction;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atlas-interactions"] });
      qc.invalidateQueries({ queryKey: ["atlas-contact-interactions"] });
      qc.invalidateQueries({ queryKey: ["atlas-dashboard"] });
      toast.success("Interaction logged");
    },
    onError: () => toast.error("Failed to log interaction"),
  });
}

export function useAtlasTodayInteractions() {
  return useQuery({
    queryKey: ["atlas-interactions-today"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/atlas/interactions/today");
      return data.data as AtlasInteraction[];
    },
  });
}

export function useAtlasInteractionStats() {
  return useQuery({
    queryKey: ["atlas-interaction-stats"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/atlas/interactions/stats");
      return data.data as { today: number; week: number; month: number; total: number; by_type: Array<{ type: string; count: number }> };
    },
  });
}

// ============================================================
// Projects
// ============================================================

export function useAtlasProjects(page = 1, filters: { status?: string; stage?: string; search?: string } = {}) {
  return useQuery({
    queryKey: ["atlas-projects", { page, ...filters }],
    queryFn: async () => {
      const sp = new URLSearchParams({ page: String(page) });
      if (filters.status) sp.set("status", filters.status);
      if (filters.stage) sp.set("stage", filters.stage);
      if (filters.search) sp.set("search", filters.search);
      const { data } = await apiClient.get(`/api/atlas/projects?${sp}`);
      return data as { data: AtlasProject[]; meta: { total: number; page: number; page_size: number; pages: number } };
    },
  });
}

export function useAtlasProject(id: number) {
  return useQuery({
    queryKey: ["atlas-projects", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/atlas/projects/${id}`);
      return data.data as AtlasProject;
    },
    enabled: id > 0,
  });
}

export function useCreateAtlasProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<AtlasProject>) => {
      const { data } = await apiClient.post("/api/atlas/projects", body);
      return data.data as AtlasProject;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atlas-projects"] });
      qc.invalidateQueries({ queryKey: ["atlas-dashboard"] });
      toast.success("Project created");
    },
    onError: () => toast.error("Failed to create project"),
  });
}

export function useUpdateAtlasProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<AtlasProject> & { id: number }) => {
      const { data } = await apiClient.put(`/api/atlas/projects/${id}`, body);
      return data.data as AtlasProject;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atlas-projects"] });
      qc.invalidateQueries({ queryKey: ["atlas-dashboard"] });
      toast.success("Project updated");
    },
    onError: () => toast.error("Failed to update project"),
  });
}

export function useAtlasProjectPipeline() {
  return useQuery({
    queryKey: ["atlas-project-pipeline"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/atlas/projects/pipeline");
      return data.data as Array<{ stage: string; count: number; total_value: number; items: AtlasProject[] }>;
    },
  });
}

export function useAtlasProjectRevenue() {
  return useQuery({
    queryKey: ["atlas-project-revenue"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/atlas/projects/revenue");
      return data.data as { won_deals: number; won_value: number; paid_deals: number; paid_value: number; pending_value: number };
    },
  });
}

export function useAtlasOverdueProjects() {
  return useQuery({
    queryKey: ["atlas-overdue-projects"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/atlas/projects/overdue");
      return data.data as AtlasProject[];
    },
  });
}

// ============================================================
// Courses
// ============================================================

export function useAtlasCourses(page = 1, filters: { status?: string; pillar?: string } = {}) {
  return useQuery({
    queryKey: ["atlas-courses", { page, ...filters }],
    queryFn: async () => {
      const sp = new URLSearchParams({ page: String(page) });
      if (filters.status) sp.set("status", filters.status);
      if (filters.pillar) sp.set("pillar", filters.pillar);
      const { data } = await apiClient.get(`/api/atlas/courses?${sp}`);
      return data as { data: AtlasCourse[]; meta: { total: number; page: number; page_size: number; pages: number } };
    },
  });
}

export function useCreateAtlasCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<AtlasCourse>) => {
      const { data } = await apiClient.post("/api/atlas/courses", body);
      return data.data as AtlasCourse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atlas-courses"] });
      toast.success("Course created");
    },
    onError: () => toast.error("Failed to create course"),
  });
}

export function useUpdateAtlasCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<AtlasCourse> & { id: number }) => {
      const { data } = await apiClient.put(`/api/atlas/courses/${id}`, body);
      return data.data as AtlasCourse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atlas-courses"] });
      toast.success("Course updated");
    },
    onError: () => toast.error("Failed to update course"),
  });
}

export function useAtlasCourseStudents(courseId: number) {
  return useQuery({
    queryKey: ["atlas-course-students", courseId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/atlas/courses/${courseId}/students`);
      return data.data as AtlasEnrollment[];
    },
    enabled: courseId > 0,
  });
}

export function useEnrollAtlasStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, ...body }: { courseId: number; contact_id: number; amount_paid?: number }) => {
      const { data } = await apiClient.post(`/api/atlas/courses/${courseId}/enroll`, body);
      return data.data as AtlasEnrollment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atlas-courses"] });
      qc.invalidateQueries({ queryKey: ["atlas-course-students"] });
      toast.success("Student enrolled");
    },
    onError: () => toast.error("Failed to enroll student"),
  });
}

export function useAtlasCourseStats() {
  return useQuery({
    queryKey: ["atlas-course-stats"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/atlas/courses/stats");
      return data.data as { total_courses: number; published_courses: number; total_students: number; total_revenue: number; by_pillar: Array<{ pillar: string; count: number; students: number }> };
    },
  });
}

// ============================================================
// Agent Clients
// ============================================================

export function useAtlasAgentClients(page = 1, filters: { status?: string; career?: string } = {}) {
  return useQuery({
    queryKey: ["atlas-agents", { page, ...filters }],
    queryFn: async () => {
      const sp = new URLSearchParams({ page: String(page) });
      if (filters.status) sp.set("status", filters.status);
      if (filters.career) sp.set("career", filters.career);
      const { data } = await apiClient.get(`/api/atlas/agent-clients?${sp}`);
      return data as { data: AtlasAgentClient[]; meta: { total: number; page: number; page_size: number; pages: number } };
    },
  });
}

export function useCreateAtlasAgentClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<AtlasAgentClient>) => {
      const { data } = await apiClient.post("/api/atlas/agent-clients", body);
      return data.data as AtlasAgentClient;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atlas-agents"] });
      qc.invalidateQueries({ queryKey: ["atlas-dashboard"] });
      toast.success("Agent client created");
    },
    onError: () => toast.error("Failed to create agent client"),
  });
}

export function useUpdateAtlasAgentClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<AtlasAgentClient> & { id: number }) => {
      const { data } = await apiClient.put(`/api/atlas/agent-clients/${id}`, body);
      return data.data as AtlasAgentClient;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atlas-agents"] });
      qc.invalidateQueries({ queryKey: ["atlas-dashboard"] });
      toast.success("Agent client updated");
    },
    onError: () => toast.error("Failed to update agent client"),
  });
}

export function useAtlasAgentRevenue() {
  return useQuery({
    queryKey: ["atlas-agent-revenue"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/atlas/agent-clients/revenue");
      return data.data as { mrr: number; arr: number; total_setup: number; active_count: number; total_count: number };
    },
  });
}

export function useAtlasAgentsByCareer() {
  return useQuery({
    queryKey: ["atlas-agents-by-career"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/atlas/agent-clients/by-career");
      return data.data as Array<{ career: string; count: number; mrr: number }>;
    },
  });
}

// ============================================================
// Content
// ============================================================

export function useAtlasContent(page = 1, filters: { platform?: string; status?: string; pillar?: string } = {}) {
  return useQuery({
    queryKey: ["atlas-content", { page, ...filters }],
    queryFn: async () => {
      const sp = new URLSearchParams({ page: String(page) });
      if (filters.platform) sp.set("platform", filters.platform);
      if (filters.status) sp.set("status", filters.status);
      if (filters.pillar) sp.set("pillar", filters.pillar);
      const { data } = await apiClient.get(`/api/atlas/content?${sp}`);
      return data as { data: AtlasContent[]; meta: { total: number; page: number; page_size: number; pages: number } };
    },
  });
}

export function useCreateAtlasContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<AtlasContent>) => {
      const { data } = await apiClient.post("/api/atlas/content", body);
      return data.data as AtlasContent;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atlas-content"] });
      toast.success("Content created");
    },
    onError: () => toast.error("Failed to create content"),
  });
}

export function useUpdateAtlasContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<AtlasContent> & { id: number }) => {
      const { data } = await apiClient.put(`/api/atlas/content/${id}`, body);
      return data.data as AtlasContent;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atlas-content"] });
      toast.success("Content updated");
    },
    onError: () => toast.error("Failed to update content"),
  });
}

export function useAtlasContentStats() {
  return useQuery({
    queryKey: ["atlas-content-stats"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/atlas/content/stats");
      return data.data;
    },
  });
}

export function useAtlasContentIdeas() {
  return useQuery({
    queryKey: ["atlas-content-ideas"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/atlas/content/ideas");
      return data.data as AtlasContent[];
    },
  });
}

// ============================================================
// Products
// ============================================================

export function useAtlasProducts(page = 1, filters: { type?: string; status?: string; category?: string } = {}) {
  return useQuery({
    queryKey: ["atlas-products", { page, ...filters }],
    queryFn: async () => {
      const sp = new URLSearchParams({ page: String(page) });
      if (filters.type) sp.set("type", filters.type);
      if (filters.status) sp.set("status", filters.status);
      if (filters.category) sp.set("category", filters.category);
      const { data } = await apiClient.get(`/api/atlas/products?${sp}`);
      return data as { data: AtlasProduct[]; meta: { total: number; page: number; page_size: number; pages: number } };
    },
  });
}

export function useCreateAtlasProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<AtlasProduct>) => {
      const { data } = await apiClient.post("/api/atlas/products", body);
      return data.data as AtlasProduct;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atlas-products"] });
      toast.success("Product created");
    },
    onError: () => toast.error("Failed to create product"),
  });
}

export function useUpdateAtlasProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<AtlasProduct> & { id: number }) => {
      const { data } = await apiClient.put(`/api/atlas/products/${id}`, body);
      return data.data as AtlasProduct;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atlas-products"] });
      toast.success("Product updated");
    },
    onError: () => toast.error("Failed to update product"),
  });
}

export function useAtlasProductStats() {
  return useQuery({
    queryKey: ["atlas-product-stats"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/atlas/products/stats");
      return data.data;
    },
  });
}

// ============================================================
// Revenue
// ============================================================

export function useAtlasRevenue(page = 1, filters: { stream?: string; from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: ["atlas-revenue", { page, ...filters }],
    queryFn: async () => {
      const sp = new URLSearchParams({ page: String(page) });
      if (filters.stream) sp.set("stream", filters.stream);
      if (filters.from) sp.set("from", filters.from);
      if (filters.to) sp.set("to", filters.to);
      const { data } = await apiClient.get(`/api/atlas/revenue?${sp}`);
      return data as { data: AtlasRevenueEntry[]; meta: { total: number; page: number; page_size: number; pages: number } };
    },
  });
}

export function useCreateAtlasRevenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<AtlasRevenueEntry>) => {
      const { data } = await apiClient.post("/api/atlas/revenue", body);
      return data.data as AtlasRevenueEntry;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atlas-revenue"] });
      qc.invalidateQueries({ queryKey: ["atlas-dashboard"] });
      toast.success("Revenue recorded");
    },
    onError: () => toast.error("Failed to record revenue"),
  });
}

export function useAtlasRevenueByStream() {
  return useQuery({
    queryKey: ["atlas-revenue-by-stream"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/atlas/revenue/by-stream");
      return data.data as Array<{ stream: string; count: number; total: number }>;
    },
  });
}

export function useAtlasWeeklyRevenue() {
  return useQuery({
    queryKey: ["atlas-weekly-revenue"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/atlas/revenue/weekly");
      return data.data;
    },
  });
}

export function useAtlasMonthlyRevenue() {
  return useQuery({
    queryKey: ["atlas-monthly-revenue"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/atlas/revenue/monthly");
      return data.data;
    },
  });
}

export function useAtlasMRR() {
  return useQuery({
    queryKey: ["atlas-mrr"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/atlas/revenue/mrr");
      return data.data as { agent_mrr: number; agent_arr: number; active_agents: number };
    },
  });
}

// ============================================================
// Daily Ops
// ============================================================

export function useAtlasDailyLogs(page = 1) {
  return useQuery({
    queryKey: ["atlas-logs", page],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/atlas/logs?page=${page}`);
      return data as { data: AtlasDailyLog[]; meta: { total: number; page: number; page_size: number; pages: number } };
    },
  });
}

export function useAtlasTodayLog() {
  return useQuery({
    queryKey: ["atlas-log-today"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/atlas/logs/today");
      return data.data as AtlasDailyLog | null;
    },
  });
}

export function useCreateAtlasLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<AtlasDailyLog>) => {
      const { data } = await apiClient.post("/api/atlas/logs", body);
      return data.data as AtlasDailyLog;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atlas-logs"] });
      qc.invalidateQueries({ queryKey: ["atlas-log-today"] });
      toast.success("Log saved");
    },
    onError: () => toast.error("Failed to save log"),
  });
}

export function useAtlasStreak() {
  return useQuery({
    queryKey: ["atlas-streak"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/atlas/logs/streak");
      return data.data as { streak: number };
    },
  });
}

export function useAtlasWeeklySummary() {
  return useQuery({
    queryKey: ["atlas-weekly-summary"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/atlas/logs/weekly-summary");
      return data.data;
    },
  });
}

// ============================================================
// Websites
// ============================================================

export function useAtlasWebsiteTasks(page = 1, filters: { site?: string; type?: string; status?: string } = {}) {
  return useQuery({
    queryKey: ["atlas-websites", { page, ...filters }],
    queryFn: async () => {
      const sp = new URLSearchParams({ page: String(page) });
      if (filters.site) sp.set("site", filters.site);
      if (filters.type) sp.set("type", filters.type);
      if (filters.status) sp.set("status", filters.status);
      const { data } = await apiClient.get(`/api/atlas/websites?${sp}`);
      return data as { data: AtlasWebsiteTask[]; meta: { total: number; page: number; page_size: number; pages: number } };
    },
  });
}

export function useCreateAtlasWebsiteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<AtlasWebsiteTask>) => {
      const { data } = await apiClient.post("/api/atlas/websites", body);
      return data.data as AtlasWebsiteTask;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atlas-websites"] });
      toast.success("Task created");
    },
    onError: () => toast.error("Failed to create task"),
  });
}

export function useUpdateAtlasWebsiteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<AtlasWebsiteTask> & { id: number }) => {
      const { data } = await apiClient.put(`/api/atlas/websites/${id}`, body);
      return data.data as AtlasWebsiteTask;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atlas-websites"] });
      toast.success("Task updated");
    },
    onError: () => toast.error("Failed to update task"),
  });
}
