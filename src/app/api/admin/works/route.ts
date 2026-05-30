import { NextResponse } from "next/server";
import type { WorkItem } from "@/features/portfolio/types";
import { getWorks, saveAllWorkItemsToCos, saveWorkItemToCos } from "@/features/portfolio/data/works-store";
import { unauthorizedResponse, verifyAdminToken } from "@/lib/admin/auth";
import { revalidateSiteContent } from "@/lib/admin/revalidate-site";

export async function GET(request: Request) {
  if (!verifyAdminToken(request)) {
    return unauthorizedResponse();
  }

  const works = await getWorks();
  return NextResponse.json({ works });
}

export async function PUT(request: Request) {
  if (!verifyAdminToken(request)) {
    return unauthorizedResponse();
  }

  let body: { works?: WorkItem[] };
  try {
    body = (await request.json()) as { works?: WorkItem[] };
  } catch {
    return NextResponse.json({ error: "请求体无效" }, { status: 400 });
  }

  if (!Array.isArray(body.works)) {
    return NextResponse.json({ error: "缺少 works 数组" }, { status: 400 });
  }

  for (const item of body.works) {
    if (!item.slug?.trim() || !item.title?.trim()) {
      return NextResponse.json({ error: "每条作品需要 slug 和 title" }, { status: 400 });
    }
  }

  const current = await getWorks();
  const currentSlugs = new Set(current.map((item) => item.slug));
  const overlap = body.works.filter((item) => currentSlugs.has(item.slug)).length;
  const suspiciousReplace =
    current.length >= 3 &&
    body.works.length === 1 &&
    overlap === 0 &&
    request.headers.get("x-admin-confirm-overwrite") !== "1";

  if (suspiciousReplace) {
    return NextResponse.json(
      {
        error:
          "拒绝保存：检测到可能的全量覆盖（现有作品将被无关单条替换）。请从后台列表正常编辑保存。",
      },
      { status: 409 },
    );
  }

  try {
    await saveAllWorkItemsToCos(body.works);
    revalidateSiteContent();
    return NextResponse.json({ ok: true, count: body.works.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!verifyAdminToken(request)) {
    return unauthorizedResponse();
  }

  let body: { items?: WorkItem[] };
  try {
    body = (await request.json()) as { items?: WorkItem[] };
  } catch {
    return NextResponse.json({ error: "请求体无效" }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "缺少 items 数组" }, { status: 400 });
  }

  for (const item of body.items) {
    if (!item.slug?.trim() || !item.title?.trim()) {
      return NextResponse.json({ error: "每条作品需要 slug 和 title" }, { status: 400 });
    }
  }

  try {
    for (const item of body.items) {
      await saveWorkItemToCos(item);
    }
    revalidateSiteContent();
    return NextResponse.json({ ok: true, count: body.items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "批量保存失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
