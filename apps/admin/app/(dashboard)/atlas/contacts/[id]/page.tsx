"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  Link2,
  MessageSquare,
  Plus,
  Loader2,
  Pencil,
  Clock,
  User,
} from "@/lib/icons";
import {
  useAtlasContact,
  useAtlasContactInteractions,
  useCreateAtlasInteraction,
  useUpdateAtlasContact,
} from "@/hooks/use-atlas";
import { useConfirm } from "@/hooks/use-confirm";
import type {
  AtlasContact,
  AtlasInteraction,
  AtlasInteractionType,
  AtlasChannel,
  AtlasDirection,
  AtlasSource,
  AtlasContactType,
  AtlasContactStatus,
  AtlasICPProfile,
} from "@repo/shared/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const now = new Date();
  const date = new Date(dateStr);
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function statusColor(status: string): string {
  switch (status) {
    case "won":
    case "replied":
      return "bg-success/10 text-success";
    case "lost":
    case "churned":
      return "bg-danger/10 text-danger";
    case "contacted":
    case "call_booked":
    case "proposal_sent":
      return "bg-warning/10 text-warning";
    case "new":
      return "bg-blue-500/10 text-blue-400";
    default:
      return "bg-bg-elevated text-text-muted";
  }
}

function typeColor(type: string): string {
  switch (type) {
    case "client":
      return "bg-success/10 text-success";
    case "prospect":
      return "bg-blue-500/10 text-blue-400";
    case "student":
      return "bg-purple-500/10 text-purple-400";
    case "agent_client":
      return "bg-orange-500/10 text-orange-400";
    case "partner":
      return "bg-yellow-500/10 text-yellow-400";
    default:
      return "bg-bg-elevated text-text-muted";
  }
}

function icpColor(profile: string): string {
  switch (profile) {
    case "A":
      return "bg-success/10 text-success";
    case "B":
      return "bg-blue-500/10 text-blue-400";
    case "C":
      return "bg-yellow-500/10 text-yellow-400";
    case "D":
      return "bg-orange-500/10 text-orange-400";
    case "E":
    case "F":
      return "bg-danger/10 text-danger";
    default:
      return "bg-bg-elevated text-text-muted";
  }
}

function interactionTypeIcon(type: string) {
  switch (type) {
    case "email_sent":
    case "email_received":
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
          <Mail className="h-4 w-4 text-blue-400" />
        </div>
      );
    case "call":
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 shrink-0">
          <Phone className="h-4 w-4 text-success" />
        </div>
      );
    case "meeting":
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 shrink-0">
          <User className="h-4 w-4 text-purple-400" />
        </div>
      );
    case "linkedin_dm":
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 shrink-0">
          <Link2 className="h-4 w-4 text-blue-500" />
        </div>
      );
    case "whatsapp":
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 shrink-0">
          <MessageSquare className="h-4 w-4 text-green-400" />
        </div>
      );
    case "note":
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10 shrink-0">
          <Pencil className="h-4 w-4 text-yellow-400" />
        </div>
      );
    default:
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-elevated shrink-0">
          <Clock className="h-4 w-4 text-text-muted" />
        </div>
      );
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INTERACTION_TYPES: { value: AtlasInteractionType; label: string }[] = [
  { value: "email_sent", label: "Email Sent" },
  { value: "email_received", label: "Email Received" },
  { value: "call", label: "Call" },
  { value: "meeting", label: "Meeting" },
  { value: "linkedin_dm", label: "LinkedIn DM" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "note", label: "Note" },
];

const CHANNELS: { value: AtlasChannel; label: string }[] = [
  { value: "gmail", label: "Gmail" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "zoom", label: "Zoom" },
  { value: "in_person", label: "In Person" },
];

const DIRECTIONS: { value: AtlasDirection; label: string }[] = [
  { value: "outbound", label: "Outbound" },
  { value: "inbound", label: "Inbound" },
];

const CONTACT_TYPES = ["prospect", "client", "student", "agent_client", "partner"];
const CONTACT_STATUSES = ["new", "contacted", "replied", "call_booked", "proposal_sent", "won", "lost", "churned"];
const SOURCES = ["youtube", "linkedin", "tiktok", "referral", "cold_outreach", "website", "gumroad"];
const ICP_PROFILES = ["A", "B", "C", "D", "E", "F"];

// ---------------------------------------------------------------------------
// Edit Contact Modal
// ---------------------------------------------------------------------------

function EditContactModal({
  contact,
  onClose,
}: {
  contact: AtlasContact;
  onClose: () => void;
}) {
  const updateContact = useUpdateAtlasContact();
  const [form, setForm] = useState({
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    linkedin_url: contact.linkedin_url,
    company: contact.company,
    role: contact.role,
    location: contact.location,
    source: contact.source,
    type: contact.type,
    status: contact.status,
    icp_profile: contact.icp_profile,
    deal_value: contact.deal_value,
    currency: contact.currency || "USD",
    notes: contact.notes,
    tags: contact.tags ? JSON.stringify(contact.tags) : "[]",
    next_followup_at: contact.next_followup_at
      ? new Date(contact.next_followup_at).toISOString().slice(0, 16)
      : "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let parsedTags: string[] = [];
    try {
      parsedTags = JSON.parse(form.tags);
    } catch {
      parsedTags = [];
    }
    updateContact.mutate(
      {
        id: contact.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        linkedin_url: form.linkedin_url,
        company: form.company,
        role: form.role,
        location: form.location,
        source: form.source as AtlasContact["source"],
        type: form.type as AtlasContact["type"],
        status: form.status as AtlasContact["status"],
        icp_profile: form.icp_profile as AtlasContact["icp_profile"],
        deal_value: Number(form.deal_value),
        currency: form.currency,
        notes: form.notes,
        tags: parsedTags,
        next_followup_at: form.next_followup_at || null,
      },
      { onSuccess: () => onClose() }
    );
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none";
  const selectClass =
    "w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-bg-secondary p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Edit Contact</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-bg-elevated hover:text-foreground transition-colors"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Name</label>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Email</label>
              <input
                className={inputClass}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Phone</label>
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">LinkedIn URL</label>
              <input
                className={inputClass}
                value={form.linkedin_url}
                onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Company</label>
              <input
                className={inputClass}
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Role</label>
              <input
                className={inputClass}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Location</label>
              <input
                className={inputClass}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Source</label>
              <select
                className={selectClass}
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value as AtlasSource })}
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Type</label>
              <select
                className={selectClass}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as AtlasContactType })}
              >
                {CONTACT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Status</label>
              <select
                className={selectClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as AtlasContactStatus })}
              >
                {CONTACT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">ICP Profile</label>
              <select
                className={selectClass}
                value={form.icp_profile}
                onChange={(e) => setForm({ ...form, icp_profile: e.target.value as AtlasICPProfile })}
              >
                {ICP_PROFILES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Deal Value</label>
              <input
                className={inputClass}
                type="number"
                value={form.deal_value}
                onChange={(e) => setForm({ ...form, deal_value: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Currency</label>
              <input
                className={inputClass}
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Next Followup</label>
              <input
                className={inputClass}
                type="datetime-local"
                value={form.next_followup_at}
                onChange={(e) => setForm({ ...form, next_followup_at: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Tags (JSON array)</label>
            <input
              className={inputClass}
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder='["tag1", "tag2"]'
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Notes</label>
            <textarea
              className={`${inputClass} resize-y`}
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateContact.isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {updateContact.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Log Interaction Modal
// ---------------------------------------------------------------------------

function LogInteractionModal({
  contactId,
  onClose,
}: {
  contactId: number;
  onClose: () => void;
}) {
  const createInteraction = useCreateAtlasInteraction();
  const [form, setForm] = useState({
    type: "email_sent" as AtlasInteractionType,
    channel: "gmail" as AtlasChannel,
    direction: "outbound" as AtlasDirection,
    subject: "",
    body: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createInteraction.mutate(
      {
        contact_id: contactId,
        type: form.type,
        channel: form.channel,
        direction: form.direction,
        subject: form.subject,
        body: form.body,
      },
      { onSuccess: () => onClose() }
    );
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none";
  const selectClass =
    "w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl border border-border bg-bg-secondary p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Log Interaction</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-bg-elevated hover:text-foreground transition-colors"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Type</label>
              <select
                className={selectClass}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as AtlasInteractionType })}
              >
                {INTERACTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Channel</label>
              <select
                className={selectClass}
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value as AtlasChannel })}
              >
                {CHANNELS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Direction</label>
              <select
                className={selectClass}
                value={form.direction}
                onChange={(e) => setForm({ ...form, direction: e.target.value as AtlasDirection })}
              >
                {DIRECTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Subject</label>
            <input
              className={inputClass}
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Interaction subject..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Body</label>
            <textarea
              className={`${inputClass} resize-y`}
              rows={4}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Details about the interaction..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createInteraction.isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {createInteraction.isPending ? "Saving..." : "Log Interaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AtlasContactDetailPage() {
  const params = useParams();
  const contactId = Number(params.id);
  const confirm = useConfirm();

  const { data: contact, isLoading } = useAtlasContact(contactId);
  const { data: interactions, isLoading: loadingInteractions } =
    useAtlasContactInteractions(contactId);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <p className="text-text-secondary">Contact not found.</p>
        <Link href="/atlas?tab=contacts" className="text-accent hover:underline text-sm">
          Back to contacts
        </Link>
      </div>
    );
  }

  // Computed stats
  const interactionCount = contact.interaction_count ?? interactions?.length ?? 0;
  const projectCount = contact.project_count ?? contact.projects?.length ?? 0;
  const daysSinceLastContact = daysSince(contact.last_contacted_at);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* BACK LINK                                                         */}
      {/* ================================================================= */}
      <Link
        href="/atlas?tab=contacts"
        className="inline-flex items-center gap-1.5 rounded-lg p-1.5 text-sm text-text-muted hover:bg-bg-elevated hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to contacts
      </Link>

      {/* ================================================================= */}
      {/* CONTACT HEADER CARD                                               */}
      {/* ================================================================= */}
      <div className="rounded-xl border border-border bg-bg-secondary p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 border-2 border-accent/20">
              <span className="text-2xl font-bold text-accent">
                {(contact.name || "?")[0]?.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground truncate">
                {contact.name}
              </h1>
              {(contact.company || contact.role) && (
                <div className="flex items-center gap-1.5 mt-1 text-sm text-text-secondary">
                  <Building2 className="h-3.5 w-3.5" />
                  {[contact.role, contact.company].filter(Boolean).join(" at ")}
                </div>
              )}
            </div>

            {/* Contact details row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {contact.email && (
                <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <Mail className="h-3.5 w-3.5" />
                  {contact.email}
                </span>
              )}
              {contact.phone && (
                <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <Phone className="h-3.5 w-3.5" />
                  {contact.phone}
                </span>
              )}
              {contact.location && (
                <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <MapPin className="h-3.5 w-3.5" />
                  {contact.location}
                </span>
              )}
              {contact.linkedin_url && (
                <a
                  href={contact.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  LinkedIn
                </a>
              )}
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(contact.status)}`}>
                {contact.status.replace(/_/g, " ")}
              </span>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${typeColor(contact.type)}`}>
                {contact.type.replace(/_/g, " ")}
              </span>
              <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-bg-elevated text-text-muted capitalize">
                {contact.source.replace(/_/g, " ")}
              </span>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${icpColor(contact.icp_profile)}`}>
                ICP {contact.icp_profile}
              </span>
              {contact.deal_value > 0 && (
                <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-success/10 text-success">
                  {formatCurrency(contact.deal_value, contact.currency)}
                </span>
              )}
            </div>
          </div>

          {/* Edit button */}
          <button
            onClick={() => setShowEditModal(true)}
            className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-elevated hover:text-foreground transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* STATS ROW                                                         */}
      {/* ================================================================= */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-bg-secondary p-4 text-center">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
            Interactions
          </p>
          <p className="text-2xl font-bold text-foreground">{interactionCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-bg-secondary p-4 text-center">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
            Projects
          </p>
          <p className="text-2xl font-bold text-foreground">{projectCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-bg-secondary p-4 text-center">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
            Deal Value
          </p>
          <p className="text-2xl font-bold text-foreground">
            {contact.deal_value > 0
              ? formatCurrency(contact.deal_value, contact.currency)
              : "--"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-secondary p-4 text-center">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
            Days Since Contact
          </p>
          <p className="text-2xl font-bold text-foreground">
            {daysSinceLastContact !== null ? daysSinceLastContact : "--"}
          </p>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TWO-COLUMN LAYOUT                                                 */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT: Interaction Timeline (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Interaction Timeline
            </h2>
            <button
              onClick={() => setShowInteractionModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Log Interaction
            </button>
          </div>

          {loadingInteractions ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : !interactions || interactions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-bg-secondary p-12 text-center">
              <MessageSquare className="h-10 w-10 text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-secondary">
                No interactions recorded yet.
              </p>
              <button
                onClick={() => setShowInteractionModal(true)}
                className="mt-3 text-sm text-accent hover:underline"
              >
                Log your first interaction
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-bg-secondary divide-y divide-border">
              {interactions.map((interaction: AtlasInteraction) => (
                <div
                  key={interaction.id}
                  className="flex items-start gap-3 px-5 py-4"
                >
                  {interactionTypeIcon(interaction.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">
                        {interaction.subject || interaction.type.replace(/_/g, " ")}
                      </p>
                      <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium bg-bg-elevated text-text-muted capitalize">
                        {interaction.channel}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                          interaction.direction === "inbound"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-success/10 text-success"
                        }`}
                      >
                        {interaction.direction}
                      </span>
                    </div>
                    {interaction.body && (
                      <p className="text-xs text-text-muted mt-1 line-clamp-2">
                        {interaction.body}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-text-muted whitespace-nowrap">
                    {formatDateTime(interaction.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Contact Info Card (1/3) */}
        <div className="space-y-4">
          {/* Tags */}
          <div className="rounded-xl border border-border bg-bg-secondary p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Tags</h3>
            {contact.tags && contact.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {contact.tags.map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-accent/10 text-accent"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted">No tags</p>
            )}
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-border bg-bg-secondary p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Notes</h3>
            {contact.notes ? (
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {contact.notes}
              </p>
            ) : (
              <p className="text-xs text-text-muted">No notes</p>
            )}
          </div>

          {/* Next Followup */}
          <div className="rounded-xl border border-border bg-bg-secondary p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Next Followup</h3>
            {contact.next_followup_at ? (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm text-foreground">
                  {formatDate(contact.next_followup_at)}
                </span>
                {daysSince(contact.next_followup_at) !== null &&
                  daysSince(contact.next_followup_at)! > 0 && (
                    <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium bg-danger/10 text-danger">
                      Overdue
                    </span>
                  )}
              </div>
            ) : (
              <p className="text-xs text-text-muted">No followup scheduled</p>
            )}
          </div>

          {/* Anti-ICP Flags */}
          {contact.anti_icp_flags &&
            Object.keys(contact.anti_icp_flags).length > 0 && (
              <div className="rounded-xl border border-border bg-bg-secondary p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Anti-ICP Flags
                </h3>
                <div className="space-y-1.5">
                  {Object.entries(contact.anti_icp_flags).map(
                    ([flag, value]) =>
                      value && (
                        <div
                          key={flag}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-danger shrink-0" />
                          <span className="text-text-secondary capitalize">
                            {flag.replace(/_/g, " ")}
                          </span>
                        </div>
                      )
                  )}
                </div>
              </div>
            )}

          {/* Linked Projects */}
          <div className="rounded-xl border border-border bg-bg-secondary p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Linked Projects
            </h3>
            {contact.projects && contact.projects.length > 0 ? (
              <div className="space-y-2">
                {contact.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/atlas/projects/${project.id}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-bg-elevated transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {project.name}
                      </p>
                      <p className="text-xs text-text-muted capitalize">
                        {project.status.replace(/_/g, " ")}
                      </p>
                    </div>
                    {project.deal_value > 0 && (
                      <span className="shrink-0 text-xs font-medium text-success">
                        {formatCurrency(project.deal_value, project.currency)}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted">No linked projects</p>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* MODALS                                                            */}
      {/* ================================================================= */}
      {showEditModal && (
        <EditContactModal
          contact={contact}
          onClose={() => setShowEditModal(false)}
        />
      )}
      {showInteractionModal && (
        <LogInteractionModal
          contactId={contactId}
          onClose={() => setShowInteractionModal(false)}
        />
      )}
    </div>
  );
}
