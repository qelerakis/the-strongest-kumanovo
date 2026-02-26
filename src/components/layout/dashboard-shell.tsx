"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

interface DashboardShellProps {
  children: React.ReactNode;
  title: string;
  username: string;
  role: "admin" | "member";
}

export function DashboardShell({
  children,
  title,
  username,
  role,
}: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleCloseMobileNav = useCallback(() => {
    setMobileNavOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <MobileNav isOpen={mobileNavOpen} onClose={handleCloseMobileNav} />

      <div className="lg:pl-[250px]">
        <Header
          title={title}
          username={username}
          role={role}
          onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
        />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
