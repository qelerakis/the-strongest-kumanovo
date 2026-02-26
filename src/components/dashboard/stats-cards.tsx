"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { formatMKD } from "@/lib/utils";
import StaggerChildren, {
  staggerItemVariants,
} from "@/components/motion/stagger-children";

interface StatsCardsProps {
  stats: {
    totalMembers: number;
    activeMembers: number;
    monthlyAttendanceRate: number;
    monthlyRevenue: number;
  };
}

function MembersIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ActiveIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function AttendanceIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  );
}

function RevenueIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

const cards = [
  {
    key: "totalMembers" as const,
    icon: MembersIcon,
    accentClass: "text-text-primary",
    borderClass: "border-surface-border",
    iconBgClass: "bg-surface-hover",
    format: (v: number) => v.toLocaleString("en-US"),
  },
  {
    key: "activeMembers" as const,
    icon: ActiveIcon,
    accentClass: "text-success",
    borderClass: "border-success/30",
    iconBgClass: "bg-success/15",
    format: (v: number) => v.toLocaleString("en-US"),
  },
  {
    key: "monthlyAttendanceRate" as const,
    icon: AttendanceIcon,
    accentClass: "text-brand-gold-light",
    borderClass: "border-brand-gold/30",
    iconBgClass: "bg-brand-gold/15",
    format: (v: number) => `${v}%`,
  },
  {
    key: "monthlyRevenue" as const,
    icon: RevenueIcon,
    accentClass: "text-brand-red-light",
    borderClass: "border-brand-red/30",
    iconBgClass: "bg-brand-red/15",
    format: (v: number) => formatMKD(v),
  },
];

export default function StatsCards({ stats }: StatsCardsProps) {
  const t = useTranslations("dashboard");

  return (
    <StaggerChildren className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key];

        return (
          <motion.div key={card.key} variants={staggerItemVariants}>
            <Card className={`${card.borderClass} overflow-hidden`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-text-muted">
                      {t(card.key)}
                    </span>
                    <motion.span
                      className={`text-3xl font-bold tracking-tight ${card.accentClass}`}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.2,
                        ease: "easeOut",
                      }}
                    >
                      {card.format(value)}
                    </motion.span>
                  </div>
                  <div
                    className={`rounded-xl p-3 ${card.iconBgClass} ${card.accentClass}`}
                  >
                    <Icon />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </StaggerChildren>
  );
}
