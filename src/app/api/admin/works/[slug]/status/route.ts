import { NextResponse } from "next/server";
import { fetchWorkItemFromCos } from "@/features/portfolio/data/works-store";
import { unauthorizedResponse, verifyAdminToken } from "@/lib/admin/auth";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

/** 直接从 COS 读取单条作品的视频状态，绕过本地快照缓存 */
export async function GET(request: Request, context: RouteContext) {
  if (!verifyAdminToken(request)) {
    return unauthorizedResponse();
  }

  const { slug } = await context.params;
  if (!slug?.trim()) {
    return NextResponse.json({ error: "缺少 slug" }, { status: 400 });
  }

  const work = await fetchWorkItemFromCos(slug);
  if (!work) {
    return NextResponse.json({ error: "作品不存在" }, { status: 404 });
  }

  const hasMediaUrl = !!work.mediaUrl?.trim();
  const hasOriginal = !!work.mediaUrlOriginal?.trim();

  let status: "dual" | "raw-only" | "none";
  if (hasMediaUrl) {
    status = "dual";
  } else if (hasOriginal) {
    status = "raw-only";
  } else {
    status = "none";
  }

  return NextResponse.json({
    slug: work.slug,
    status,
    mediaUrl: work.mediaUrl || null,
    mediaUrlOriginal: work.mediaUrlOriginal || null,
  });
}
