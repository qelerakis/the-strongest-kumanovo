"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Nav() {
  const t = useTranslations("landing");
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 200], [0.3, 0.6]);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 flex h-12 items-center justify-between px-6 backdrop-blur-xl sm:px-8 lg:px-12"
      style={{ backgroundColor: useTransform(bgOpacity, (v) => `rgba(12, 10, 9, ${v})`) }}
    >
      <Link
        href="/"
        className="text-sm font-medium tracking-[0.2em] uppercase text-brand-white/90 hover:text-brand-white transition-colors"
      >
        The Strongest
      </Link>

      <Link
        href="/login"
        className="text-sm font-medium text-text-secondary hover:text-brand-white transition-colors"
      >
        {t("login")}
      </Link>
    </motion.nav>
  );
}
