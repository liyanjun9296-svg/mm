import { NextResponse } from "next/server";
import {
  getVideoCategories,
  saveVideoCategoriesToCos,
} from "@/features/portfolio/data/categories-store";
import { unauthorizedResponse, verifyAdminToken } from "@/lib/admin/auth";
import { revalidateSiteContent } from "@/lib/admin/revalidate-site";

export async function GET(request: Request) {
  if (!verifyAdminToken(request)) {
    return unauthorizedResponse();
  }

  const categories = await getVideoCategories();
  return NextResponse.json({ categories });
}

export async function PUT(request: Request) {
  if (!verifyAdminToken(request)) {
    return unauthorizedResponse();
  }

  let body: { categories?: string[] };
  try {
    body = (await request.json()) as { categories?: string[] };
  } catch {
    return NextResponse.json({ error: "请求体无效" }, { status: 400 });
  }

  if (!Array.isArray(body.categories)) {
    return NextResponse.json({ error: "缺少 categories 数组" }, { status: 400 });
  }

  try {
    await saveVideoCategoriesToCos(body.categories);
    revalidateSiteContent();
    return NextResponse.json({ ok: true, count: body.categories.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
