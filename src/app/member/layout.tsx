import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MemberShell } from "@/components/layout/member-shell";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user.role !== "member") {
    redirect("/login");
  }

  return (
    <MemberShell username={session.user.username}>
      {children}
    </MemberShell>
  );
}
