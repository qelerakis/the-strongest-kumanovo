"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { setLocale } from "@/lib/actions/locale";
import { useTransition } from "react";

export default function Footer() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSwitch(newLocale: string) {
    startTransition(async () => {
      await setLocale(newLocale);
      router.refresh();
    });
  }

  return (
    <footer className="flex items-center justify-between px-6 py-8 sm:px-8 lg:px-12">
      <p className="text-sm text-text-muted">
        &copy; {new Date().getFullYear()} The Strongest Kumanovo
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => handleSwitch("en")}
          disabled={isPending}
          aria-label="Switch to English"
          className={`text-sm transition-colors ${
            locale === "en"
              ? "text-brand-white font-medium"
              : "text-text-secondary hover:text-brand-white"
          }`}
        >
          EN
        </button>
        <span className="text-text-muted">/</span>
        <button
          onClick={() => handleSwitch("mk")}
          disabled={isPending}
          aria-label="Switch to Macedonian"
          className={`text-sm transition-colors ${
            locale === "mk"
              ? "text-brand-white font-medium"
              : "text-text-secondary hover:text-brand-white"
          }`}
        >
          MK
        </button>
      </div>
    </footer>
  );
}
