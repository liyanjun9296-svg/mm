import { notFound } from "next/navigation";
import WorksListClient from "@/components/admin/WorksListClient";
import { isLocale } from "@/lib/i18n";

type AdminWorksPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminWorksPage({ params }: AdminWorksPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <main className="section admin-page">
      <div className="container">
        <WorksListClient locale={locale} />
      </div>
    </main>
  );
}
