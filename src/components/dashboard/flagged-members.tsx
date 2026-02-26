"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface FlaggedMember {
  memberId: string;
  fullName: string;
  attendanceCount: number;
}

interface FlaggedMembersProps {
  flaggedMembers: FlaggedMember[];
}

function WarningIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-brand-gold-light"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export default function FlaggedMembers({
  flaggedMembers,
}: FlaggedMembersProps) {
  const t = useTranslations("dashboard");

  return (
    <Card className="border-brand-gold/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <WarningIcon />
          <CardTitle className="flex items-center gap-2">
            {t("flaggedMembers")}
            <Badge variant="gold">{flaggedMembers.length}</Badge>
          </CardTitle>
        </div>
        <p className="text-sm text-text-muted">{t("flaggedDescription")}</p>
      </CardHeader>
      <CardContent>
        {flaggedMembers.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-surface-border py-8">
            <p className="text-sm text-text-muted">{t("allOnTrack")}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("memberName")}</TableHead>
                <TableHead className="text-center">
                  {t("sessionsAttended")}
                </TableHead>
                <TableHead className="text-right">
                  {/* Actions column */}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flaggedMembers.map((member) => (
                <TableRow key={member.memberId}>
                  <TableCell className="font-medium">
                    {member.fullName}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        member.attendanceCount === 0 ? "red" : "gold"
                      }
                    >
                      {member.attendanceCount} {t("sessions")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/dashboard/members/${member.memberId}`}
                    >
                      <Button variant="ghost" size="sm">
                        {t("view")}
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
