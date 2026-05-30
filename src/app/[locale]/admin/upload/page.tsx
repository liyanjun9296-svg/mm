import { redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

type AdminUploadRedirectProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminUploadRedirect({ params }: AdminUploadRedirectProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  redirect(`/${locale}/admin`);
}
