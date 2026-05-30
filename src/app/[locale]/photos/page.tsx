import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";

type PhotosRedirectProps = {
  params: Promise<{ locale: string }>;
};

export default async function PhotosRedirect({ params }: PhotosRedirectProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  redirect(`/${locale}/portfolio?tab=photo`);
}
