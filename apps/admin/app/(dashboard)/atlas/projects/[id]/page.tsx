"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  DollarSign,
  GitBranch,
  FileText,
  ExternalLink,
  Check,
  X,
  Clock,
  Pencil,
} from "@/lib/icons";
import { useAtlasProject, useUpdateAtlasProject } from "@/hooks/use-atlas";
import type { AtlasProject, AtlasProjectStatus, AtlasProjectStage } from "@repo/shared/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "---";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusColor(status: string): string {
  switch (status) {
    case "won":
    case "paid":
    case "delivered":
      return "bg-success/10 text-success";
    case "lost":
      return "bg-danger/10 text-danger";
    case "in_progress":
    case "negotiation":
    case "invoiced":
      return "bg-warning/10 text-warning";
    case "discovery":
    case "proposal_sent":
      return "bg-blue-500/10 text-blue-400";
    default:
      return "bg-bg-elevated text-text-muted";
  }
}

function stageColor(stage: string): string {
  switch (stage) {
    case "won":
      return "bg-success/10 text-success";
    case "lost":
      return "bg-danger/10 text-danger";
    case "closing":
      return "bg-warning/10 text-warning";
    case "proposal":
      return "bg-blue-500/10 text-blue-400";
    case "qualified":
      return "bg-purple-500/10 text-purple-400";
    case "lead":
    default:
      return "bg-bg-elevated text-text-muted";
  }
}

const PROJECT_STATUSES = [
  "discovery",
  "proposal_sent",
  "negotiation",
  "won",
  "in_progress",
  "delivered",
  "invoiced",
  "paid",
  "lost",
] as const;

const PROJECT_STAGES = [
  "lead",
  "qualified",
  "proposal",
  "closing",
  "won",
  "lost",
] as const;

// ---------------------------------------------------------------------------
// Edit Modal
// ---------------------------------------------------------------------------

function EditProjectModal({
  project,
  onClose,
}: {
  project: AtlasProject;
  onClose: () => void;
}) {
  const update = useUpdateAtlasProject();

  const [form, setForm] = useState({
    name: project.name,
    description: project.description,
    status: project.status,
    stage: project.stage,
    deal_value: project.deal_value,
    currency: project.currency || "USD",
    upfront_percentage: project.upfront_percentage,
    upfront_paid: project.upfront_paid,
    final_paid: project.final_paid,
    tech_stack: (project.tech_stack ?? []).join(", "),
    start_date: project.start_date?.slice(0, 10) ?? "",
    deadline: project.deadline?.slice(0, 10) ?? "",
    delivered_date: project.delivered_date?.slice(0, 10) ?? "",
    contract_signed: project.contract_signed,
    contract_url: project.contract_url,
    proposal_url: project.proposal_url,
    repo_url: project.repo_url,
    notes: project.notes,
    contact_id: project.contact_id,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const techArr = form.tech_stack
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    update.mutate(
      {
        id: project.id,
        name: form.name,
        description: form.description,
        status: form.status as AtlasProject["status"],
        stage: form.stage as AtlasProject["stage"],
        deal_value: Number(form.deal_value),
        currency: form.currency,
        upfront_percentage: Number(form.upfront_percentage),
        upfront_paid: form.upfront_paid,
        final_paid: form.final_paid,
        tech_stack: techArr.length > 0 ? techArr : null,
        start_date: form.start_date || null,
        deadline: form.deadline || null,
        delivered_date: form.delivered_date || null,
        contract_signed: form.contract_signed,
        contract_url: form.contract_url,
        proposal_url: form.proposal_url,
        repo_url: form.repo_url,
        notes: form.notes,
        contact_id: form.contact_id,
      },
      { onSuccess: () => onClose() },
    );
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none";
  const labelClass = "block text-xs font-medium text-text-secondary mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-bg-secondary p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Edit Project
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-bg-hover hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className={labelClass}>Name</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              className={inputClass}
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          {/* Status + Stage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Status</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as AtlasProjectStatus })}
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Stage</label>
              <select
                className={inputClass}
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value as AtlasProjectStage })}
              >
                {PROJECT_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Deal Value + Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Deal Value</label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={form.deal_value}
                onChange={(e) =>
                  setForm({ ...form, deal_value: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className={labelClass}>Currency</label>
              <input
                className={inputClass}
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              />
            </div>
          </div>

          {/* Upfront % + Paid booleans */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Upfront %</label>
              <input
                type="number"
                min="0"
                max="100"
                className={inputClass}
                value={form.upfront_percentage}
                onChange={(e) =>
                  setForm({
                    ...form,
                    upfront_percentage: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.upfront_paid}
                  onChange={(e) =>
                    setForm({ ...form, upfront_paid: e.target.checked })
                  }
                  className="rounded border-border accent-accent"
                />
                Upfront Paid
              </label>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.final_paid}
                  onChange={(e) =>
                    setForm({ ...form, final_paid: e.target.checked })
                  }
                  className="rounded border-border accent-accent"
                />
                Final Paid
              </label>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Start Date</label>
              <input
                type="date"
                className={inputClass}
                value={form.start_date}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelClass}>Deadline</label>
              <input
                type="date"
                className={inputClass}
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Delivered Date</label>
              <input
                type="date"
                className={inputClass}
                value={form.delivered_date}
                onChange={(e) =>
                  setForm({ ...form, delivered_date: e.target.value })
                }
              />
            </div>
          </div>

          {/* Contract signed */}
          <div>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={form.contract_signed}
                onChange={(e) =>
                  setForm({ ...form, contract_signed: e.target.checked })
                }
                className="rounded border-border accent-accent"
              />
              Contract Signed
            </label>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={labelClass}>Contract URL</label>
              <input
                className={inputClass}
                placeholder="https://..."
                value={form.contract_url}
                onChange={(e) =>
                  setForm({ ...form, contract_url: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelClass}>Proposal URL</label>
              <input
                className={inputClass}
                placeholder="https://..."
                value={form.proposal_url}
                onChange={(e) =>
                  setForm({ ...form, proposal_url: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelClass}>Repo URL</label>
              <input
                className={inputClass}
                placeholder="https://..."
                value={form.repo_url}
                onChange={(e) =>
                  setForm({ ...form, repo_url: e.target.value })
                }
              />
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <label className={labelClass}>Tech Stack (comma-separated)</label>
            <input
              className={inputClass}
              placeholder="Next.js, Go, PostgreSQL"
              value={form.tech_stack}
              onChange={(e) => setForm({ ...form, tech_stack: e.target.value })}
            />
          </div>

          {/* Contact ID */}
          <div>
            <label className={labelClass}>Contact ID</label>
            <input
              type="number"
              className={inputClass}
              value={form.contact_id ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  contact_id: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              className={inputClass}
              rows={4}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={update.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {update.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline components
// ---------------------------------------------------------------------------

function BooleanBadge({
  value,
  trueLabel,
  falseLabel,
}: {
  value: boolean;
  trueLabel: string;
  falseLabel: string;
}) {
  return value ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
      <Check className="h-3.5 w-3.5" />
      {trueLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-elevated px-2.5 py-0.5 text-xs font-medium text-text-muted">
      <X className="h-3.5 w-3.5" />
      {falseLabel}
    </span>
  );
}

function ExternalLinkItem({
  label,
  url,
}: {
  label: string;
  url: string;
}) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-4 py-2.5 text-sm text-foreground hover:bg-bg-hover transition-colors"
    >
      <ExternalLink className="h-4 w-4 text-text-muted" />
      {label}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AtlasProjectDetailPage() {
  const params = useParams();
  const projectId = Number(params.id);

  const { data: project, isLoading } = useAtlasProject(projectId);
  const [showEdit, setShowEdit] = useState(false);

  // Loading
  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // Not found
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <p className="text-text-secondary">Project not found.</p>
        <Link
          href="/atlas?tab=projects"
          className="text-accent hover:underline text-sm"
        >
          Back to projects
        </Link>
      </div>
    );
  }

  const upfrontAmount = project.deal_value * (project.upfront_percentage / 100);
  const finalAmount = project.deal_value - upfrontAmount;
  const hasLinks =
    project.contract_url || project.proposal_url || project.repo_url;
  const techStack = project.tech_stack ?? [];

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* BACK LINK                                                         */}
      {/* ================================================================= */}
      <Link
        href="/atlas?tab=projects"
        className="inline-flex items-center gap-1.5 rounded-lg p-1.5 text-sm text-text-muted hover:bg-bg-hover hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      {/* ================================================================= */}
      {/* PROJECT HEADER                                                    */}
      {/* ================================================================= */}
      <div className="rounded-xl border border-border bg-bg-secondary p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="text-sm text-text-secondary">
                    {project.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(project.status)}`}
                  >
                    {project.status.replace(/_/g, " ")}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${stageColor(project.stage)}`}
                  >
                    {project.stage}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowEdit(true)}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:bg-bg-hover hover:text-foreground transition-colors"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            </div>
          </div>

          {/* Deal value card */}
          <div className="shrink-0 rounded-xl border border-border bg-bg-elevated p-4 text-center min-w-[160px]">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <DollarSign className="h-4 w-4 text-success" />
              <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Deal Value
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(project.deal_value, project.currency || "USD")}
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* INFO GRID                                                         */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Client */}
        <div className="rounded-xl border border-border bg-bg-secondary p-4 space-y-1">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Client
          </p>
          {project.contact ? (
            <Link
              href={`/atlas?tab=contacts`}
              className="text-sm font-medium text-accent hover:underline"
            >
              {project.contact.name || project.contact.email}
            </Link>
          ) : project.contact_id ? (
            <p className="text-sm text-text-secondary">
              Contact #{project.contact_id}
            </p>
          ) : (
            <p className="text-sm text-text-muted">No client assigned</p>
          )}
        </div>

        {/* Deal Value + Currency */}
        <div className="rounded-xl border border-border bg-bg-secondary p-4 space-y-1">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Deal Value
          </p>
          <p className="text-sm font-medium text-foreground">
            {formatCurrency(project.deal_value, project.currency || "USD")}
            <span className="ml-1.5 text-xs text-text-muted">
              {project.currency || "USD"}
            </span>
          </p>
        </div>

        {/* Upfront */}
        <div className="rounded-xl border border-border bg-bg-secondary p-4 space-y-1">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Upfront ({project.upfront_percentage}%)
          </p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              {formatCurrency(upfrontAmount, project.currency || "USD")}
            </p>
            <BooleanBadge
              value={project.upfront_paid}
              trueLabel="Paid"
              falseLabel="Unpaid"
            />
          </div>
        </div>

        {/* Final Payment */}
        <div className="rounded-xl border border-border bg-bg-secondary p-4 space-y-1">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Final Payment
          </p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              {formatCurrency(finalAmount, project.currency || "USD")}
            </p>
            <BooleanBadge
              value={project.final_paid}
              trueLabel="Paid"
              falseLabel="Unpaid"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="rounded-xl border border-border bg-bg-secondary p-4 space-y-2">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Timeline
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <Calendar className="h-3.5 w-3.5 text-text-muted" />
              <span className="text-text-muted">Start:</span>
              <span className="text-foreground">
                {formatDate(project.start_date)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <Clock className="h-3.5 w-3.5 text-text-muted" />
              <span className="text-text-muted">Deadline:</span>
              <span className="text-foreground">
                {formatDate(project.deadline)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <Check className="h-3.5 w-3.5 text-text-muted" />
              <span className="text-text-muted">Delivered:</span>
              <span className="text-foreground">
                {formatDate(project.delivered_date)}
              </span>
            </div>
          </div>
        </div>

        {/* Contract Signed */}
        <div className="rounded-xl border border-border bg-bg-secondary p-4 space-y-1">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Contract
          </p>
          <BooleanBadge
            value={project.contract_signed}
            trueLabel="Signed"
            falseLabel="Not Signed"
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* LINKS                                                             */}
      {/* ================================================================= */}
      {hasLinks && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-text-muted" />
            Links
          </h2>
          <div className="flex flex-wrap gap-3">
            <ExternalLinkItem label="Contract" url={project.contract_url} />
            <ExternalLinkItem label="Proposal" url={project.proposal_url} />
            <ExternalLinkItem label="Repository" url={project.repo_url} />
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TECH STACK                                                        */}
      {/* ================================================================= */}
      {techStack.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-text-muted" />
            Tech Stack
          </h2>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* NOTES                                                             */}
      {/* ================================================================= */}
      {project.notes && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-text-muted" />
            Notes
          </h2>
          <div className="rounded-xl border border-border bg-bg-secondary p-5">
            <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
              {project.notes}
            </p>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* EDIT MODAL                                                        */}
      {/* ================================================================= */}
      {showEdit && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}
