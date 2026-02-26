"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { setLocale } from "@/lib/actions/locale";
import { useTransition } from "react";

export function LocaleSwitcher() {
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
    <div className="flex items-center gap-1 bg-surface-card border border-surface-border rounded-lg p-0.5">
      <button
        onClick={() => handleSwitch("en")}
        disabled={isPending}
        className={`px-2.5 py-1 rounded-md text-sm font-medium transition-colors ${
          locale === "en"
            ? "bg-brand-red text-white"
            : "text-text-secondary hover:text-brand-white"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => handleSwitch("mk")}
        disabled={isPending}
        className={`px-2.5 py-1 rounded-md text-sm font-medium transition-colors ${
          locale === "mk"
            ? "bg-brand-red text-white"
            : "text-text-secondary hover:text-brand-white"
        }`}
      >
        MK
      </button>
    </div>
  );
}
