import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getTranslations } from "next-intl/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  const t = await getTranslations("dashboard");

  return (
    <DashboardShell
      title={t("title")}
      username={session.user.username}
      role={session.user.role}
    >
      {children}
    </DashboardShell>
  );
}
