import { notFound } from "next/navigation";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { isLocale } from "@/lib/i18n";

type AdminPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <main className="section admin-page">
      <div className="container">
        <AdminLoginForm locale={locale} />
      </div>
    </main>
  );
}
