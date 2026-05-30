import { notFound } from "next/navigation";
import WorkEditForm from "@/components/admin/WorkEditForm";
import { isLocale } from "@/lib/i18n";

type AdminWorkEditPageProps = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ type?: string }>;
};

export default async function AdminWorkEditPage({
  params,
  searchParams,
}: AdminWorkEditPageProps) {
  const { locale, slug } = await params;
  const { type } = await searchParams;
  if (!isLocale(locale)) {
    notFound();
  }

  const initialType =
    type === "photo" ? "photo" : type === "article" ? "article" : "video";

  return (
    <main className="section admin-page">
      <div className="container">
        <WorkEditForm locale={locale} slugParam={slug} initialType={initialType} />
      </div>
    </main>
  );
}
