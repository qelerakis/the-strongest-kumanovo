import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getFullSchedule } from "@/lib/queries/schedule";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import Hero from "@/components/landing/hero";
import SportsShowcase from "@/components/landing/sports-showcase";
import ScheduleDisplay from "@/components/landing/schedule-display";
import ContactSection from "@/components/landing/contact-section";

export default async function Home() {
  const t = await getTranslations("landing");
  const schedule = await getFullSchedule();

  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-surface-border/50 bg-surface/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-brand-white">
            {t("title")}
          </span>
          <span className="text-lg font-bold text-brand-gold">
            {t("subtitle")}
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-brand-red px-4 py-2 text-sm font-medium text-brand-white transition-colors hover:bg-brand-red-light active:bg-brand-red-dark"
          >
            {t("login")}
          </Link>
        </div>
      </nav>

      {/* Page sections */}
      <main>
        <Hero />
        <SportsShowcase />
        <ScheduleDisplay schedule={schedule} />
        <ContactSection />
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border px-4 py-8 text-center">
        <p className="text-sm text-text-muted">
          &copy; {new Date().getFullYear()} The Strongest Kumanovo. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}
