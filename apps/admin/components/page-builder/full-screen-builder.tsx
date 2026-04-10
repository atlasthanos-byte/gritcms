"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SectionRenderer, type PageSection } from "@repo/shared/sections";
import {
  GripVertical,
  Trash2,
  Plus,
  Layers,
  Zap,
  ChevronLeft,
  Settings,
  Monitor,
  Tablet,
  Smartphone,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Loader2,
  ExternalLink,
} from "@/lib/icons";
import { usePageBuilder, getSectionLabel } from "./use-page-builder";
import { SectionPicker } from "./section-picker";
import { SectionEditor } from "./section-editor";
import { AIPanel } from "./ai-panel";
import { TemplateGallery } from "./template-gallery";
import { PageSettingsPanel } from "./page-settings-panel";

// ---------------------------------------------------------------------------
// SortableItem
// ---------------------------------------------------------------------------

interface SortableItemProps {
  section: PageSection;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function SortableItem({ section, isSelected, onSelect, onRemove }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 rounded-lg border px-2 py-2 text-sm transition-colors cursor-pointer ${
        isSelected
          ? "border-accent bg-accent/10 text-foreground"
          : "border-transparent hover:border-border hover:bg-bg-hover text-text-muted"
      }`}
      onClick={onSelect}
    >
      <button
        type="button"
        className="shrink-0 cursor-grab touch-none text-text-muted hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 truncate font-medium">
        {getSectionLabel(section.sectionId)}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="shrink-0 rounded p-1 text-text-muted opacity-0 transition-opacity hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100"
        title="Remove section"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Viewport presets
// ---------------------------------------------------------------------------

type ViewportSize = "desktop" | "tablet" | "mobile";

const viewportWidths: Record<ViewportSize, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

// ---------------------------------------------------------------------------
// FullScreenBuilder
// ---------------------------------------------------------------------------

interface FullScreenBuilderProps {
  sections: PageSection[];
  onChange: (sections: PageSection[]) => void;
  // Page metadata
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
  // Actions
  onSave: () => void;
  onPublish: () => void;
  onBack: () => void;
  isSaving: boolean;
}

export function FullScreenBuilder({
  sections,
  onChange,
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
  onSave,
  onPublish,
  onBack,
  isSaving,
}: FullScreenBuilderProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const pb = usePageBuilder({ sections, onChange });

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

  const statusColors: Record<string, string> = {
    draft: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    archived: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  };

  return (
    <div className="flex h-full flex-col">
      {/* ================================================================= */}
      {/* TOOLBAR                                                           */}
      {/* ================================================================= */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-bg-secondary px-3">
        {/* Left toolbar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg p-1.5 text-text-muted hover:bg-bg-hover hover:text-foreground transition-colors"
            title="Back to pages"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Untitled page"
              className="bg-transparent text-sm font-semibold text-foreground placeholder:text-text-muted focus:outline-none border-0 p-0 w-48 focus:ring-0"
            />
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${
                statusColors[status] || statusColors.draft
              }`}
            >
              {status}
            </span>
          </div>
        </div>

        {/* Center toolbar - viewport toggles */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5">
          <button
            type="button"
            onClick={() => setViewport("desktop")}
            className={`rounded-md p-1.5 transition-colors ${
              viewport === "desktop"
                ? "bg-accent text-white"
                : "text-text-muted hover:text-foreground"
            }`}
            title="Desktop"
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewport("tablet")}
            className={`rounded-md p-1.5 transition-colors ${
              viewport === "tablet"
                ? "bg-accent text-white"
                : "text-text-muted hover:text-foreground"
            }`}
            title="Tablet"
          >
            <Tablet className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewport("mobile")}
            className={`rounded-md p-1.5 transition-colors ${
              viewport === "mobile"
                ? "bg-accent text-white"
                : "text-text-muted hover:text-foreground"
            }`}
            title="Mobile"
          >
            <Smartphone className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Right toolbar */}
        <div className="flex items-center gap-2">
          {status === "published" && slug && (
            <a
              href={`${process.env.NEXT_PUBLIC_WEB_URL || ""}/${slug === "home" ? "" : slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-text-muted hover:bg-bg-hover hover:text-foreground transition-colors"
              title="View live page"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Live
            </a>
          )}

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded-lg p-1.5 text-text-muted hover:bg-bg-hover hover:text-foreground transition-colors"
            title="Page settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || !title}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-bg-hover disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving
              </span>
            ) : (
              "Save Draft"
            )}
          </button>

          <button
            type="button"
            onClick={onPublish}
            disabled={isSaving || !title}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            Publish
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* MAIN AREA                                                         */}
      {/* ================================================================= */}
      <div className="flex flex-1 overflow-hidden">
        {/* ----- LEFT PANEL: Section structure ----- */}
        <div
          className={`flex shrink-0 flex-col border-r border-border bg-bg-secondary transition-all duration-200 ${
            leftOpen ? "w-64" : "w-0"
          }`}
        >
          {leftOpen && (
            <>
              {/* Header */}
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Layers className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-foreground">Sections</span>
                <span className="ml-auto rounded-full bg-bg-hover px-2 py-0.5 text-[10px] font-medium text-text-muted">
                  {sections.length}
                </span>
              </div>

              {/* Sortable list */}
              <div className="flex-1 overflow-y-auto px-2 py-2">
                {sections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Layers className="mb-2 h-8 w-8 text-text-muted/40" />
                    <p className="text-xs text-text-muted">No sections yet</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={pb.handleDragEnd}
                  >
                    <SortableContext
                      items={pb.sectionIds}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-col gap-1">
                        {sections.map((section, index) => (
                          <SortableItem
                            key={section.id}
                            section={section}
                            isSelected={pb.selectedIndex === index}
                            onSelect={() => pb.setSelectedIndex(index)}
                            onRemove={() => pb.handleRemoveSection(index)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>

              {/* Bottom actions */}
              <div className="flex flex-col gap-2 border-t border-border px-3 py-3">
                <button
                  type="button"
                  onClick={() => pb.setPickerOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent/90"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Section
                </button>
                <button
                  type="button"
                  onClick={() => pb.setTemplateGalleryOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-muted transition-colors hover:bg-bg-hover hover:text-foreground"
                >
                  <Layers className="h-3.5 w-3.5" />
                  Browse Templates
                </button>
              </div>
            </>
          )}
        </div>

        {/* ----- LEFT PANEL TOGGLE ----- */}
        <button
          type="button"
          onClick={() => setLeftOpen(!leftOpen)}
          className="flex h-full w-5 shrink-0 items-center justify-center border-r border-border bg-bg-secondary text-text-muted hover:bg-bg-hover hover:text-foreground transition-colors"
          title={leftOpen ? "Collapse structure" : "Expand structure"}
        >
          {leftOpen ? (
            <PanelLeftClose className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftOpen className="h-3.5 w-3.5" />
          )}
        </button>

        {/* ----- CENTER: Preview canvas ----- */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
            <div
              className="mx-auto rounded-lg bg-white text-gray-900 shadow-sm ring-1 ring-gray-200 transition-all duration-300"
              style={{
                maxWidth: viewportWidths[viewport],
                minHeight: "calc(100vh - 120px)",
              }}
            >
              {sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <Layers className="mb-3 h-12 w-12 text-gray-300" />
                  <p className="text-lg font-semibold text-gray-400">
                    Add your first section
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    Click &quot;Add Section&quot; or browse templates to get started
                  </p>
                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => pb.setPickerOpen(true)}
                      className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Section
                    </button>
                    <button
                      type="button"
                      onClick={() => pb.setTemplateGalleryOpen(true)}
                      className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <Layers className="h-4 w-4" />
                      Templates
                    </button>
                  </div>
                </div>
              ) : (
                sections.map((section, index) => (
                  <SectionRenderer
                    key={section.id}
                    sectionId={section.sectionId}
                    props={section.props}
                    customClasses={section.customClasses}
                    onClick={() => pb.setSelectedIndex(index)}
                    isSelected={pb.selectedIndex === index}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ----- RIGHT PANEL TOGGLE ----- */}
        <button
          type="button"
          onClick={() => setRightOpen(!rightOpen)}
          className="flex h-full w-5 shrink-0 items-center justify-center border-l border-border bg-bg-secondary text-text-muted hover:bg-bg-hover hover:text-foreground transition-colors"
          title={rightOpen ? "Collapse editor" : "Expand editor"}
        >
          {rightOpen ? (
            <PanelRightClose className="h-3.5 w-3.5" />
          ) : (
            <PanelRightOpen className="h-3.5 w-3.5" />
          )}
        </button>

        {/* ----- RIGHT PANEL: Section editor ----- */}
        <div
          className={`flex shrink-0 flex-col border-l border-border bg-bg-secondary transition-all duration-200 ${
            rightOpen ? "w-80" : "w-0"
          }`}
        >
          {rightOpen && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm font-semibold text-foreground">
                  {pb.selectedSection ? "Edit Section" : "Properties"}
                </span>
                {pb.selectedSection && (
                  <button
                    type="button"
                    onClick={() => pb.setAiPanelOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-2.5 py-1.5 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/20"
                    title="AI Assist"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    AI Assist
                  </button>
                )}
              </div>

              {/* Editor body */}
              <div className="flex-1 overflow-y-auto">
                {pb.selectedSection && pb.selectedDef ? (
                  <SectionEditor
                    sectionId={pb.selectedSection.sectionId}
                    props={pb.selectedSection.props}
                    customClasses={pb.selectedSection.customClasses || ""}
                    onPropsChange={pb.handlePropsChange}
                    onClassesChange={pb.handleClassesChange}
                    onAIAssist={() => pb.setAiPanelOpen(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                    <Layers className="mb-3 h-8 w-8 text-text-muted/40" />
                    <p className="text-sm font-medium text-text-muted">
                      Select a section to edit
                    </p>
                    <p className="mt-1 text-xs text-text-muted/70">
                      Click on a section in the list or preview to edit its properties
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* OVERLAYS                                                          */}
      {/* ================================================================= */}

      <SectionPicker
        open={pb.pickerOpen}
        onClose={() => pb.setPickerOpen(false)}
        onSelect={pb.handleAddSection}
      />

      <TemplateGallery
        open={pb.templateGalleryOpen}
        onClose={() => pb.setTemplateGalleryOpen(false)}
        onApply={pb.handleApplyTemplate}
      />

      <AIPanel
        open={pb.aiPanelOpen}
        onClose={() => pb.setAiPanelOpen(false)}
        sectionId={pb.selectedSection?.sectionId || ""}
        currentProps={pb.selectedSection?.props || {}}
        onApply={pb.handleAIApply}
      />

      <PageSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title={title}
        slug={slug}
        excerpt={excerpt}
        status={status}
        template={template}
        paymentProvider={paymentProvider}
        metaTitle={metaTitle}
        metaDescription={metaDescription}
        ogImage={ogImage}
        onTitleChange={onTitleChange}
        onSlugChange={onSlugChange}
        onExcerptChange={onExcerptChange}
        onStatusChange={onStatusChange}
        onTemplateChange={onTemplateChange}
        onPaymentProviderChange={onPaymentProviderChange}
        onMetaTitleChange={onMetaTitleChange}
        onMetaDescriptionChange={onMetaDescriptionChange}
        onOGImageChange={onOGImageChange}
      />
    </div>
  );
}
