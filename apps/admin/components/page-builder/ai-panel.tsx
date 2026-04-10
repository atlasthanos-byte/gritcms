"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Zap, X, Loader2, Check } from "@/lib/icons";
import { useAIComplete } from "@/hooks/use-ai";
import { getSection } from "@repo/shared/sections";

interface AIPanelProps {
  open: boolean;
  onClose: () => void;
  sectionId: string;
  currentProps: Record<string, unknown>;
  onApply: (newProps: Record<string, unknown>) => void;
}

const PRESET_PROMPTS = [
  "Make it more professional",
  "Rewrite for tech audience",
  "Add more urgency",
  "Make it more casual",
  "Shorten the text",
  "Make it more persuasive",
];

export function AIPanel({
  open,
  onClose,
  sectionId,
  currentProps,
  onApply,
}: AIPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [proposedProps, setProposedProps] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const aiComplete = useAIComplete();

  // Reset state when panel opens
  useEffect(() => {
    if (open) {
      setPrompt("");
      setProposedProps(null);
      setError(null);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleGenerate = useCallback(
    async (userPrompt: string) => {
      if (!userPrompt.trim()) return;

      setError(null);
      setProposedProps(null);

      const section = getSection(sectionId);
      const sectionName = section?.name ?? sectionId;
      const sectionDescription = section?.description ?? "";

      const fullPrompt = `You are a content assistant for a page builder. You are editing a "${sectionName}" section${sectionDescription ? ` (${sectionDescription})` : ""}.

Current section props (JSON):
${JSON.stringify(currentProps, null, 2)}

User instruction: ${userPrompt}

Return ONLY a valid JSON object with the updated props. Keep the same structure and keys, only change text/content values as requested. Do not add explanation, only the JSON.`;

      try {
        const result = await aiComplete.mutateAsync({
          prompt: fullPrompt,
          maxTokens: 2000,
          temperature: 0.7,
        });

        // Parse the AI response as JSON
        const content = result.content.trim();
        // Try to extract JSON from the response (it may be wrapped in markdown code fences)
        const jsonMatch =
          content.match(/```(?:json)?\s*([\s\S]*?)```/) ??
          content.match(/^(\{[\s\S]*\})$/m);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1].trim());
          setProposedProps(parsed);
        } else {
          // Try parsing the whole content as JSON
          const parsed = JSON.parse(content);
          setProposedProps(parsed);
        }
      } catch (err) {
        setError(
          err instanceof SyntaxError
            ? "AI returned an invalid response. Try again with a simpler prompt."
            : err instanceof Error && err.message
              ? err.message
              : "Failed to generate content. Please try again."
        );
      }
    },
    [sectionId, currentProps, aiComplete]
  );

  const handlePresetClick = useCallback(
    (presetPrompt: string) => {
      setPrompt(presetPrompt);
      handleGenerate(presetPrompt);
    },
    [handleGenerate]
  );

  const handleApply = useCallback(() => {
    if (proposedProps) {
      onApply(proposedProps);
      onClose();
    }
  }, [proposedProps, onApply, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleGenerate(prompt);
      }
    },
    [handleGenerate, prompt]
  );

  // Compute which keys changed for the preview
  const changedKeys = proposedProps
    ? Object.keys(proposedProps).filter((key) => {
        const oldVal = JSON.stringify(currentProps[key]);
        const newVal = JSON.stringify(proposedProps[key]);
        return oldVal !== newVal;
      })
    : [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-bg-secondary shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">AI Assist</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-hover hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          {/* Text input */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">
              Describe what you want...
            </label>
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Change the headline to focus on speed and efficiency"
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
            />
            <p className="mt-1 text-[10px] text-text-muted">
              Press Ctrl+Enter to generate
            </p>
          </div>

          {/* Preset prompts */}
          <div>
            <p className="mb-2 text-xs font-medium text-text-muted">
              Quick prompts
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_PROMPTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={aiComplete.isPending}
                  onClick={() => handlePresetClick(preset)}
                  className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={() => handleGenerate(prompt)}
            disabled={!prompt.trim() || aiComplete.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiComplete.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Generate
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Result preview */}
          {proposedProps && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" />
                <p className="text-xs font-medium text-foreground">
                  Proposed Changes
                </p>
                {changedKeys.length > 0 && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                    {changedKeys.length} field{changedKeys.length !== 1 ? "s" : ""} changed
                  </span>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto rounded-lg border border-border bg-black/20 p-3">
                {changedKeys.length === 0 ? (
                  <p className="text-xs text-text-muted">
                    No visible changes detected. Try a different prompt.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {changedKeys.map((key) => {
                      const oldValue = currentProps[key];
                      const newValue = proposedProps[key];
                      const isStringValue =
                        typeof oldValue === "string" &&
                        typeof newValue === "string";

                      return (
                        <div key={key} className="text-xs">
                          <p className="mb-1 font-medium text-text-muted">
                            {key}
                          </p>
                          {isStringValue ? (
                            <>
                              <p className="line-through text-red-400/70 mb-0.5">
                                {oldValue as string}
                              </p>
                              <p className="text-green-400">
                                {newValue as string}
                              </p>
                            </>
                          ) : (
                            <pre className="whitespace-pre-wrap break-all text-foreground/80">
                              {JSON.stringify(newValue, null, 2)}
                            </pre>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {proposedProps && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-6 py-3">
            <button
              type="button"
              onClick={() => setProposedProps(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-bg-hover hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={changedKeys.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4" />
              Apply Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
