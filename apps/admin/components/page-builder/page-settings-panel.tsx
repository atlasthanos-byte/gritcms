"use client";

import { X } from "@/lib/icons";
import { Dropzone, type UploadedFile } from "@/components/ui/dropzone";

interface PageSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  slug: string;
  excerpt: string;
  status: "draft" | "published" | "archived";
  template: string;
  paymentProvider: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  onTitleChange: (v: string) => void;
  onSlugChange: (v: string) => void;
  onExcerptChange: (v: string) => void;
  onStatusChange: (v: "draft" | "published" | "archived") => void;
  onTemplateChange: (v: string) => void;
  onPaymentProviderChange: (v: string) => void;
  onMetaTitleChange: (v: string) => void;
  onMetaDescriptionChange: (v: string) => void;
  onOGImageChange: (v: string) => void;
}

export function PageSettingsPanel({
  open,
  onClose,
  title,
  slug,
  excerpt,
  status,
  template,
  paymentProvider,
  metaTitle,
  metaDescription,
  ogImage,
  onTitleChange,
  onSlugChange,
  onExcerptChange,
  onStatusChange,
  onTemplateChange,
  onPaymentProviderChange,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onOGImageChange,
}: PageSettingsPanelProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-bg-secondary shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Page Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-bg-hover transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Page title"
              className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Slug</label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-muted">/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  onSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                }
                placeholder="page-slug"
                className="flex-1 rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) =>
                onStatusChange(e.target.value as "draft" | "published" | "archived")
              }
              className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Template */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Template</label>
            <select
              value={template}
              onChange={(e) => onTemplateChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="default">Default</option>
              <option value="full-width">Full Width</option>
              <option value="landing">Landing Page</option>
              <option value="sidebar">With Sidebar</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Payment Processor</label>
            <select
              value={paymentProvider || "stripe"}
              onChange={(e) => onPaymentProviderChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="stripe">Stripe</option>
            </select>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => onExcerptChange(e.target.value)}
              placeholder="Brief page description..."
              rows={3}
              className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>

          <div className="border-t border-border pt-5">
            <h3 className="text-xs font-semibold text-foreground mb-4">SEO</h3>

            {/* Meta Title */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Meta Title
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => onMetaTitleChange(e.target.value)}
                placeholder="SEO title"
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Meta Description */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Meta Description
              </label>
              <textarea
                value={metaDescription}
                onChange={(e) => onMetaDescriptionChange(e.target.value)}
                placeholder="SEO description"
                rows={3}
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none"
              />
            </div>

            {/* OG Image */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                OG Image
              </label>
              <Dropzone
                variant="compact"
                maxFiles={1}
                maxSize={5 * 1024 * 1024}
                accept={{ "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"] }}
                value={
                  ogImage
                    ? [
                        {
                          url: ogImage,
                          name: "og-image",
                          size: 0,
                          type: "image/jpeg",
                        } as UploadedFile,
                      ]
                    : []
                }
                onFilesChange={(files) => onOGImageChange(files[0]?.url || "")}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
