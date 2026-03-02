"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTranslations } from "next-intl";

const EASE = [0.25, 0.1, 0.25, 1] as const;

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
    transition: { duration: 0.8, ease: EASE },
  },
};

export default function Hero() {
  const t = useTranslations("landing");
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Scroll-linked dissolve: as user scrolls past hero, text fades and drifts
  const titleOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.15]);
  const titleY = useTransform(scrollYProgress, [0, 0.5], [0, -60]);
  const titleLetterSpacing = useTransform(scrollYProgress, [0, 0.5], [0, 5]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      {/* Soft radial red glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-brand-red/6 blur-[150px]" />
      </div>

      <motion.div
        style={{ opacity: titleOpacity, y: titleY }}
        className="relative z-10 flex flex-col items-center px-4 text-center"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          {/* Title */}
          <motion.h1
            variants={lineVariants}
            style={{ letterSpacing: useTransform(titleLetterSpacing, (v) => `${-0.02 + v * 0.01}em`) }}
            className="font-display text-6xl font-black leading-[0.9] text-brand-white sm:text-8xl lg:text-9xl"
          >
            {t("title").toUpperCase()}
          </motion.h1>

          {/* Subtitle */}
          <motion.h2
            variants={lineVariants}
            style={{ letterSpacing: useTransform(titleLetterSpacing, (v) => `${-0.02 + v * 0.01}em`) }}
            className="font-display text-6xl font-black leading-[0.9] text-brand-gold sm:text-8xl lg:text-9xl"
          >
            {t("subtitle").toUpperCase()}
          </motion.h2>

          {/* Tagline */}
          <motion.p
            variants={lineVariants}
            className="mt-8 text-lg font-light text-text-secondary sm:text-xl"
          >
            {t("tagline")}
          </motion.p>

          {/* Single CTA */}
          <motion.a
            variants={lineVariants}
            href="#schedule"
            className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-brand-red"
          >
            {t("viewSchedule")}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="animate-bounce"
            >
              <path
                d="M8 3v10m0 0l-4-4m4 4l4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.a>
        </motion.div>
      </motion.div>
    </section>
  );
}
