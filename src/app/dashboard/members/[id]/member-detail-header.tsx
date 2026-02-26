"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import BeltRankBadge from "@/components/members/belt-rank-badge";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { toggleMemberStatus, deleteMember } from "@/lib/actions/members";
import { createMemberCredentials } from "@/lib/actions/auth";
import type { BeltRank } from "@/types";

interface MemberDetailHeaderProps {
  member: {
    id: string;
    fullName: string;
    isActive: boolean;
    beltRank: string | null;
    user: {
      userId: string;
      username: string;
      role: string;
    } | null;
  };
}

export default function MemberDetailHeader({
  member,
}: MemberDetailHeaderProps) {
  const t = useTranslations("members");
  const tCommon = useTranslations("common");
  const tBelts = useTranslations("belts");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [showCredDialog, setShowCredDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [credUsername, setCredUsername] = useState("");
  const [credPassword, setCredPassword] = useState("");
  const [credError, setCredError] = useState<string | null>(null);
  const [credCreated, setCredCreated] = useState(!!member.user);

  const belt = (member.beltRank || "white") as BeltRank;

  function handleToggleStatus() {
    startTransition(async () => {
      await toggleMemberStatus(member.id);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteMember(member.id);
      if (result.success) {
        router.push("/dashboard/members");
      }
    });
  }

  function handleCreateCredentials() {
    setCredError(null);
    if (credUsername.length < 3) {
      setCredError("Username must be at least 3 characters");
      return;
    }
    if (credPassword.length < 6) {
      setCredError("Password must be at least 6 characters");
      return;
    }

    startTransition(async () => {
      try {
        await createMemberCredentials(member.id, credUsername, credPassword);
        setCredCreated(true);
        setShowCredDialog(false);
        router.refresh();
      } catch {
        setCredError("Failed to create credentials");
      }
    });
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary">
                {member.fullName}
              </h1>
              <Badge variant={member.isActive ? "green" : "red"}>
                {member.isActive ? tCommon("active") : tCommon("inactive")}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <BeltRankBadge rank={belt} />
              <span className="text-sm text-text-secondary">
                {tBelts(belt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!credCreated && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowCredDialog(true)}
            >
              {t("createCredentials")}
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleToggleStatus}
            loading={isPending}
          >
            {member.isActive ? t("deactivate") : t("activate")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            {tCommon("delete")}
          </Button>
        </div>
      </div>

      {/* Create credentials dialog */}
      <Dialog open={showCredDialog} onOpenChange={setShowCredDialog}>
        <DialogHeader>
          <DialogTitle>{t("createCredentials")}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="flex flex-col gap-4">
            {credError && (
              <p className="text-sm text-error">{credError}</p>
            )}
            <Input
              label="Username"
              value={credUsername}
              onChange={(e) => setCredUsername(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              value={credPassword}
              onChange={(e) => setCredPassword(e.target.value)}
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setShowCredDialog(false)}
          >
            {tCommon("cancel")}
          </Button>
          <Button onClick={handleCreateCredentials} loading={isPending}>
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogHeader>
          <DialogTitle>{tCommon("delete")}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete {member.fullName}? This action
            cannot be undone.
          </p>
        </DialogContent>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteDialog(false)}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            loading={isPending}
          >
            {tCommon("delete")}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
