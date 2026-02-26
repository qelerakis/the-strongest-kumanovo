"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { logoutAction } from "@/lib/actions/auth";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

interface HeaderProps {
  title: string;
  username: string;
  role: "admin" | "member";
  onToggleMobileNav?: () => void;
}

export function Header({ title, username, role, onToggleMobileNav }: HeaderProps) {
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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-surface-border bg-surface-card/80 backdrop-blur-sm px-4 lg:px-6">
      {/* Left side: hamburger + title */}
      <div className="flex items-center gap-3">
        {onToggleMobileNav && (
          <button
            onClick={onToggleMobileNav}
            className="inline-flex items-center justify-center rounded-lg p-2 text-text-secondary hover:bg-surface-hover hover:text-brand-white transition-colors lg:hidden"
            aria-label="Toggle navigation"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-semibold text-brand-white">{title}</h1>
      </div>

      {/* Right side: locale switcher, user info, logout */}
      <div className="flex items-center gap-3">
        <LocaleSwitcher />

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm text-text-secondary">{username}</span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              role === "admin"
                ? "bg-brand-red/20 text-brand-red-light"
                : "bg-brand-gold/20 text-brand-gold"
            }`}
          >
            {role}
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
  );
}
