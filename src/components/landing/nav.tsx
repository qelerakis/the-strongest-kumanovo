"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/lib/actions/locale";

export default function Nav() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 200], [0.3, 0.6]);
  const bgColor = useTransform(bgOpacity, (v) => `rgba(12, 10, 9, ${v})`);

  function handleSwitch(newLocale: string) {
    startTransition(async () => {
      await setLocale(newLocale);
      router.refresh();
    });
  }

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 flex h-12 items-center justify-between px-6 backdrop-blur-xl sm:px-8 lg:px-12"
      style={{ backgroundColor: bgColor }}
    >
      <Link
        href="/"
        className="text-sm font-medium tracking-[0.2em] uppercase text-brand-white/90 hover:text-brand-white transition-colors"
      >
        The Strongest
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleSwitch("en")}
            disabled={isPending}
            aria-label="Switch to English"
            className={`text-xs transition-colors ${
              locale === "en"
                ? "text-brand-white font-medium"
                : "text-text-secondary hover:text-brand-white"
            }`}
          >
            EN
          </button>
          <span className="text-text-muted text-xs">/</span>
          <button
            onClick={() => handleSwitch("mk")}
            disabled={isPending}
            aria-label="Switch to Macedonian"
            className={`text-xs transition-colors ${
              locale === "mk"
                ? "text-brand-white font-medium"
                : "text-text-secondary hover:text-brand-white"
            }`}
          >
            MK
          </button>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-text-secondary hover:text-brand-white transition-colors"
        >
          {t("login")}
        </Link>
      </div>
    </motion.nav>
  );
}
