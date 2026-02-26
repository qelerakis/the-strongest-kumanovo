"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const lineVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

export default function Hero() {
  const t = useTranslations("landing");

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface">
      {/* Background gradient with red accent glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-red/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-brand-red/8 blur-[120px]" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface to-transparent" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center gap-8 px-4 text-center"
      >
        {/* Main title */}
        <div className="flex flex-col items-center gap-2">
          <motion.h1
            variants={lineVariants}
            className="text-5xl font-extrabold tracking-tight text-brand-white sm:text-7xl lg:text-8xl"
          >
            {t("title").toUpperCase()}
          </motion.h1>
          <motion.h2
            variants={lineVariants}
            className="text-4xl font-extrabold tracking-tight text-brand-gold sm:text-6xl lg:text-7xl"
          >
            {t("subtitle").toUpperCase()}
          </motion.h2>
        </div>

        {/* Tagline */}
        <motion.p
          variants={lineVariants}
          className="text-lg text-text-secondary sm:text-xl lg:text-2xl"
        >
          {t("tagline")}
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          variants={buttonVariants}
          className="flex flex-col items-center gap-4 sm:flex-row"
        >
          <a
            href="#schedule"
            className="inline-flex items-center justify-center rounded-lg bg-brand-red px-8 py-3 text-base font-medium text-brand-white transition-colors hover:bg-brand-red-light active:bg-brand-red-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {t("viewSchedule")}
          </a>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border border-surface-border bg-transparent px-8 py-3 text-base font-medium text-text-primary transition-colors hover:bg-surface-hover active:bg-surface-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {t("login")}
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
