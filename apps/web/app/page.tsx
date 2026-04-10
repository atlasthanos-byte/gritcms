"use client";

import { usePublicPage } from "@/hooks/use-website";
import { LivePageRenderer } from "@/components/live-page-renderer";
import { PageJsonLd } from "@/components/json-ld";
import type { PageSection } from "@repo/shared/sections";
import { DefaultHomePage } from "@/components/default-home";

export default function HomePage() {
  const { data: page, isLoading } = usePublicPage("home");

  // If a CMS "home" page exists with section-based content, render it with live data
  const isSectionBased =
    page &&
    Array.isArray(page.content) &&
    page.content.length > 0 &&
    (page.content[0] as unknown as Record<string, unknown>)?.sectionId;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (isSectionBased) {
    return (
      <>
        <PageJsonLd page={page} />
        <LivePageRenderer
          sections={page.content as unknown as PageSection[]}
          pageSlug={page.slug}
          paymentProvider={page.payment_provider}
        />
      </>
    );
  }

  // Fallback to the default home page
  return <DefaultHomePage />;
}
