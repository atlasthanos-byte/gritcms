"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePage, useUpdatePage, useCreatePage } from "@/hooks/use-website";
import { FullScreenBuilder } from "@/components/page-builder/full-screen-builder";
import type { PageSection } from "@repo/shared/sections";
import { Loader2 } from "@/lib/icons";

export default function BuilderPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === "new";
  const pageId = isNew ? 0 : Number(params.id);

  const { data: existingPage, isLoading } = usePage(pageId);
  const { mutate: updatePage, isPending: isUpdating } = useUpdatePage();
  const { mutate: createPage, isPending: isCreating } = useCreatePage();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [template, setTemplate] = useState("default");
  const [paymentProvider, setPaymentProvider] = useState("stripe");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [ogImage, setOGImage] = useState("");
  const [sections, setSections] = useState<PageSection[]>([]);

  useEffect(() => {
    if (existingPage) {
      setTitle(existingPage.title);
      setSlug(existingPage.slug);
      setExcerpt(existingPage.excerpt || "");
      setStatus(existingPage.status);
      setTemplate(existingPage.template || "default");
      setPaymentProvider(existingPage.payment_provider || "stripe");
      setMetaTitle(existingPage.meta_title || "");
      setMetaDescription(existingPage.meta_description || "");
      setOGImage(existingPage.og_image || "");
      const raw = existingPage.content as unknown;
      if (
        Array.isArray(raw) &&
        raw.length > 0 &&
        (raw[0] as Record<string, unknown>)?.sectionId
      ) {
        setSections(raw as PageSection[]);
      }
    }
  }, [existingPage]);

  const handleSave = () => {
    const body = {
      title,
      slug,
      excerpt,
      status,
      template,
      payment_provider: paymentProvider,
      meta_title: metaTitle,
      meta_description: metaDescription,
      og_image: ogImage,
      content: sections as unknown as any[],
    };

    if (isNew) {
      createPage(body, {
        onSuccess: (page) => router.replace(`/builder/${page.id}`),
      });
    } else {
      updatePage({ id: pageId, ...body });
    }
  };

  const handlePublish = () => {
    const body = {
      title,
      slug,
      excerpt,
      status: "published" as const,
      template,
      payment_provider: paymentProvider,
      meta_title: metaTitle,
      meta_description: metaDescription,
      og_image: ogImage,
      content: sections as unknown as any[],
    };

    if (isNew) {
      createPage(body, {
        onSuccess: (page) => router.replace(`/builder/${page.id}`),
      });
    } else {
      updatePage({ id: pageId, ...body });
    }
    setStatus("published");
  };

  if (!isNew && isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <FullScreenBuilder
      sections={sections}
      onChange={setSections}
      title={title}
      slug={slug}
      excerpt={excerpt}
      status={status}
      template={template}
      paymentProvider={paymentProvider}
      metaTitle={metaTitle}
      metaDescription={metaDescription}
      ogImage={ogImage}
      onTitleChange={setTitle}
      onSlugChange={setSlug}
      onExcerptChange={setExcerpt}
      onStatusChange={setStatus}
      onTemplateChange={setTemplate}
      onPaymentProviderChange={setPaymentProvider}
      onMetaTitleChange={setMetaTitle}
      onMetaDescriptionChange={setMetaDescription}
      onOGImageChange={setOGImage}
      onSave={handleSave}
      onPublish={handlePublish}
      onBack={() => router.push("/website/pages")}
      isSaving={isUpdating || isCreating}
    />
  );
}
