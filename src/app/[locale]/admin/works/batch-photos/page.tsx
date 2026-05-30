import { notFound } from "next/navigation";
import PhotoBatchUploadForm from "@/components/admin/PhotoBatchUploadForm";
import { isLocale } from "@/lib/i18n";

type BatchPhotosPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function BatchPhotosPage({ params }: BatchPhotosPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <main className="section admin-page">
      <div className="container">
        <PhotoBatchUploadForm locale={locale} />
      </div>
    </main>
  );
}
