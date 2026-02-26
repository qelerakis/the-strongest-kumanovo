"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { loginAction } from "@/lib/actions/auth";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);

    if (result.success) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(t("error"));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 relative">
      <div className="absolute top-4 right-4">
        <LocaleSwitcher />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-brand-white tracking-tight">
            THE STRONGEST
          </h1>
          <p className="text-brand-gold text-xl font-semibold mt-1">
            KUMANOVO
          </p>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-xl p-8">
          <h2 className="text-xl font-semibold text-brand-white mb-6">
            {t("title")}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm text-text-secondary mb-1"
              >
                {t("username")}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full px-4 py-2.5 bg-surface border border-surface-border rounded-lg text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-shadow"
                placeholder={t("usernamePlaceholder")}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm text-text-secondary mb-1"
              >
                {t("password")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-2.5 bg-surface border border-surface-border rounded-lg text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-shadow"
                placeholder={t("passwordPlaceholder")}
              />
            </div>

            {error && <p className="text-error text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-red hover:bg-brand-red-light text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("submitting") : t("submit")}
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-xs mt-6">
          The Strongest Kumanovo &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
