"use server";

import { cookies } from "next/headers";

const SUPPORTED_LOCALES = ["en", "mk"] as const;

export async function setLocale(locale: string) {
  if (!SUPPORTED_LOCALES.includes(locale as typeof SUPPORTED_LOCALES[number])) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
