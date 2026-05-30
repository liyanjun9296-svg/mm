import { NextResponse } from "next/server";
import type { WorkItem } from "@/features/portfolio/types";
import {
  deleteWorkItemFromCos,
  getWorks,
  saveWorkItemToCos,
} from "@/features/portfolio/data/works-store";
import { unauthorizedResponse, verifyAdminToken } from "@/lib/admin/auth";
import { revalidateSiteContent } from "@/lib/admin/revalidate-site";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  if (!verifyAdminToken(request)) {
    return unauthorizedResponse();
  }

  const { slug: slugParam } = await context.params;

  let body: { work?: WorkItem; previousSlug?: string };
  try {
    body = (await request.json()) as { work?: WorkItem; previousSlug?: string };
  } catch {
    return NextResponse.json({ error: "请求体无效" }, { status: 400 });
  }

  const work = body.work;
  if (!work?.slug?.trim() || !work.title?.trim()) {
    return NextResponse.json({ error: "作品需要 slug 和 title" }, { status: 400 });
  }

  const isNew = slugParam === "new";
  const previousSlug = body.previousSlug?.trim() || (isNew ? undefined : slugParam);

  if (!isNew && previousSlug && work.slug !== previousSlug && work.slug !== slugParam) {
    return NextResponse.json({ error: "slug 变更不一致" }, { status: 400 });
  }

  const existing = await getWorks();

  if (isNew && existing.some((w) => w.slug === work.slug)) {
    return NextResponse.json({ error: "slug 已存在，请换一个" }, { status: 409 });
  }

  try {
    await saveWorkItemToCos(work, { previousSlug: previousSlug !== work.slug ? previousSlug : undefined });
    revalidateSiteContent();
    return NextResponse.json({ ok: true, slug: work.slug });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!verifyAdminToken(request)) {
    return unauthorizedResponse();
  }

  const { slug } = await context.params;
  if (!slug?.trim()) {
    return NextResponse.json({ error: "缺少 slug" }, { status: 400 });
  }

  const deleteMedia = new URL(request.url).searchParams.get("deleteMedia") === "1";

  try {
    const result = await deleteWorkItemFromCos(slug, { deleteMedia });
    revalidateSiteContent();
    return NextResponse.json({
      ok: true,
      mediaDeleted: result.mediaDeleted,
      mediaSkipped: result.mediaSkipped,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
