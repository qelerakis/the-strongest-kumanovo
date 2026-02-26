"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { logoutAction } from "@/lib/actions/auth";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

interface MemberShellProps {
  children: React.ReactNode;
  username: string;
}

export function MemberShell({ children, username }: MemberShellProps) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Top header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-surface-border bg-surface-card/80 backdrop-blur-sm px-4 sm:px-6">
        {/* Left: gym name */}
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-bold text-brand-white">
            The <span className="text-brand-red">Strongest</span>
          </span>
          <span className="text-xs font-semibold text-brand-gold -mt-1">
            Kumanovo
          </span>
        </div>

        {/* Right: locale, user, logout */}
        <div className="flex items-center gap-3">
          <LocaleSwitcher />

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm text-text-secondary">{username}</span>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-brand-gold/20 text-brand-gold">
              member
            </span>
          </div>

          <button
            onClick={handleLogout}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-hover hover:text-brand-white transition-colors disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="hidden sm:inline">{t("logout")}</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="p-4 sm:p-6 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
