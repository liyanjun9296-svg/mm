import { notFound } from "next/navigation";
import NavBar from "@/components/ui/NavBar";
import SiteActionDock from "@/components/ui/SiteActionDock";
import { getMessages } from "@/i18n/messages";
import { isLocale, type Locale } from "@/lib/i18n";

type LocaleLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const messages = getMessages(locale as Locale);

  return (
    <>
      <NavBar messages={messages} locale={locale as Locale} />
      {process.env.NODE_ENV === "development" ? (
        <SiteActionDock messages={messages} locale={locale as Locale} />
      ) : null}
      {children}
    </>
  );
}

