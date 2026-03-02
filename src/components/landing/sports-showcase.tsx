"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";

const EASE = [0.25, 0.1, 0.25, 1] as const;

type Alignment = "left" | "right" | "center";

const sports: { nameKey: "bjj" | "kickboxing" | "mma"; color: string; align: Alignment }[] = [
  { nameKey: "bjj", color: "#B91C1C", align: "left" },
  { nameKey: "kickboxing", color: "#A16207", align: "right" },
  { nameKey: "mma", color: "#22C55E", align: "center" },
];

function getAlignmentClasses(align: Alignment) {
  switch (align) {
    case "left":
      return "items-start text-left";
    case "right":
      return "items-end text-right";
    case "center":
      return "items-center text-center";
  }
}

function getSlideDirection(align: Alignment): { x: number; y: number } {
  switch (align) {
    case "left":
      return { x: -60, y: 0 };
    case "right":
      return { x: 60, y: 0 };
    case "center":
      return { x: 0, y: 40 };
  }
}

function SportBlock({
  nameKey,
  color,
  align,
  isFirst,
}: {
  nameKey: "bjj" | "kickboxing" | "mma";
  color: string;
  align: Alignment;
  isFirst: boolean;
}) {
  const t = useTranslations("sports");
  const tLanding = useTranslations("landing");
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });
  const slide = getSlideDirection(align);

  return (
    <div
      ref={ref}
      className={`flex min-h-screen flex-col justify-center px-6 py-32 sm:px-8 lg:px-24 ${getAlignmentClasses(align)}`}
    >
      {/* Section label — only on first sport */}
      {isFirst && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-16 text-sm font-medium tracking-[0.2em] uppercase text-text-secondary"
        >
          {tLanding("sportsLabel")}
        </motion.span>
      )}

      {/* Sport title */}
      <motion.h3
        initial={{ opacity: 0, x: slide.x, y: slide.y }}
        animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
        transition={{ duration: 0.7, ease: EASE }}
        className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-brand-red sm:text-6xl lg:text-7xl"
      >
        {t(nameKey).toUpperCase()}
      </motion.h3>

      {/* Accent line */}
      <motion.div
        initial={{ width: 0 }}
        animate={isInView ? { width: 80 } : {}}
        transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
        className={`mt-6 h-[2px] ${align === "center" ? "mx-auto" : ""}`}
        style={{ backgroundColor: color }}
      />

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
        className="mt-6 max-w-md text-lg leading-relaxed text-text-secondary lg:text-xl"
      >
        {t(`${nameKey}Description`)}
      </motion.p>
    </div>
  );
}

export default function SportsShowcase() {
  return (
    <section id="sports">
      {sports.map((sport, i) => (
        <SportBlock
          key={sport.nameKey}
          nameKey={sport.nameKey}
          color={sport.color}
          align={sport.align}
          isFirst={i === 0}
        />
      ))}
    </section>
  );
}
