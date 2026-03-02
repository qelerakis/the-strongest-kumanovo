"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";

const EASE = [0.25, 0.1, 0.25, 1] as const;

export default function ContactSection() {
  const t = useTranslations("landing");
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });

  const stagger = (index: number) => ({
    initial: { opacity: 0, y: 30 } as const,
    animate: isInView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.6, delay: index * 0.15, ease: EASE },
  });

  return (
    <section
      id="contact"
      className="flex min-h-screen flex-col items-center justify-center px-6 py-32 sm:px-8 lg:px-12"
    >
      <div ref={ref} className="flex flex-col items-center text-center">
        {/* Section label */}
        <motion.span
          {...stagger(0)}
          className="mb-16 text-sm font-medium tracking-[0.2em] uppercase text-text-secondary"
        >
          {t("contactLabel")}
        </motion.span>

        {/* Address — cinematic */}
        <motion.p
          {...stagger(1)}
          className="font-display text-4xl font-extrabold leading-tight text-brand-white sm:text-5xl lg:text-6xl"
        >
          Mosha Pijade 218
        </motion.p>

        <motion.p
          {...stagger(2)}
          className="mt-2 font-display text-4xl font-extrabold leading-tight text-brand-gold sm:text-5xl lg:text-6xl"
        >
          Kumanovo 1300
        </motion.p>

        <motion.p
          {...stagger(3)}
          className="mt-4 text-lg text-text-secondary sm:text-xl"
        >
          {t("contactCountry")}
        </motion.p>

        {/* Divider */}
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: 120 } : {}}
          transition={{ duration: 0.5, delay: 0.6, ease: EASE }}
          className="mt-12 h-px bg-surface-border"
        />

        {/* Phone numbers */}
        <motion.div
          {...stagger(5)}
          className="mt-12 flex flex-col gap-2"
        >
          <p className="text-xl font-light text-text-secondary sm:text-2xl">
            {t("phoneBjjMma")} <span className="text-text-muted">&mdash; {t("phoneBjjMmaLabel")}</span>
          </p>
          <p className="text-xl font-light text-text-secondary sm:text-2xl">
            {t("phoneKickbox")} <span className="text-text-muted">&mdash; {t("phoneKickboxLabel")}</span>
          </p>
        </motion.div>

        {/* Email */}
        <motion.p
          {...stagger(6)}
          className="mt-6 text-lg text-text-secondary sm:text-xl"
        >
          {t("email")}
        </motion.p>
      </div>
    </section>
  );
}
