"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import FadeIn from "@/components/motion/fade-in";

const sports = [
  {
    nameKey: "bjj" as const,
    color: "#DC2626",
    description:
      "Master the art of grappling and ground fighting. Build technique, discipline, and resilience on the mat.",
  },
  {
    nameKey: "kickboxing" as const,
    color: "#EAB308",
    description:
      "Develop powerful striking combinations. Train your speed, precision, and conditioning through stand-up combat.",
  },
  {
    nameKey: "wrestling" as const,
    color: "#2563EB",
    description:
      "Learn takedowns, control, and mat dominance. Build explosive strength and unbreakable mental toughness.",
  },
  {
    nameKey: "mma" as const,
    color: "#22C55E",
    description:
      "Combine all disciplines into one complete fighting system. Train to be versatile, adaptive, and ready.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

export default function SportsShowcase() {
  const t = useTranslations("sports");
  const tLanding = useTranslations("landing");

  return (
    <section id="sports" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-brand-white sm:text-4xl">
            {tLanding("sportsTitle")}
          </h2>
        </FadeIn>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {sports.map((sport) => (
            <motion.div
              key={sport.nameKey}
              variants={cardVariants}
              whileHover={{ scale: 1.03, y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group relative overflow-hidden rounded-xl border border-surface-border bg-surface-card p-6 transition-shadow hover:shadow-lg"
              style={{
                boxShadow: "0 0 0 0 transparent",
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Color accent bar at top */}
              <div
                className="absolute top-0 left-0 right-0 h-1 transition-all duration-300 group-hover:h-1.5"
                style={{ backgroundColor: sport.color }}
              />

              {/* Glow effect on hover */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(ellipse at top, ${sport.color}10 0%, transparent 60%)`,
                }}
              />

              <div className="relative">
                {/* Sport color dot */}
                <div
                  className="mb-4 h-3 w-3 rounded-full"
                  style={{ backgroundColor: sport.color }}
                />

                <h3 className="mb-2 text-xl font-bold text-brand-white">
                  {t(sport.nameKey)}
                </h3>

                <p className="text-sm leading-relaxed text-text-secondary">
                  {sport.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
