"use client";

import { useTranslations } from "next-intl";
import FadeIn from "@/components/motion/fade-in";

export default function ContactSection() {
  const t = useTranslations("landing");

  return (
    <section id="contact" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <FadeIn>
          <div className="rounded-xl border border-surface-border bg-surface-card p-8 sm:p-12">
            <h2 className="mb-8 text-center text-3xl font-bold text-brand-white sm:text-4xl">
              {t("contactTitle")}
            </h2>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {/* Address */}
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-red/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-brand-red"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-brand-white">
                    {t("contactAddress")}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    Mosha Pijade 218
                    <br />
                    Kumanovo 1300
                    <br />
                    {t("contactCountry")}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-red/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-brand-red"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-brand-white">
                    {t("contactPhone")}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    077-705-039 (BJJ / MMA)
                  </p>
                  <p className="text-sm text-text-secondary">
                    077-954-818 (Kick-box)
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-red/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-brand-red"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-brand-white">
                    {t("contactEmail")}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    info@thestrongest.mk
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
