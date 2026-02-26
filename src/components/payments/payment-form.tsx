"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { logPayment } from "@/lib/actions/payments";
import { getCurrentMonth } from "@/lib/utils";

interface MemberOption {
  id: string;
  fullName: string;
}

interface PaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberOption[];
  defaultMemberId?: string;
}

export default function PaymentForm({
  isOpen,
  onClose,
  members,
  defaultMemberId,
}: PaymentFormProps) {
  const t = useTranslations("payments");
  const tCommon = useTranslations("common");

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = getCurrentMonth();

  const [memberId, setMemberId] = useState(defaultMemberId ?? "");
  const [amountMkd, setAmountMkd] = useState("");
  const [paymentDate, setPaymentDate] = useState(today);
  const [monthFor, setMonthFor] = useState(currentMonth);
  const [notes, setNotes] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Sync form state when the dialog opens with new context
  useEffect(() => {
    if (isOpen) {
      setMemberId(defaultMemberId ?? "");
      setAmountMkd("");
      setPaymentDate(today);
      setMonthFor(currentMonth);
      setNotes("");
      setMemberSearch("");
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, defaultMemberId, today, currentMonth]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("memberId", memberId);
    formData.set("amountMkd", amountMkd);
    formData.set("paymentDate", paymentDate);
    formData.set("monthFor", monthFor);
    formData.set("notes", notes);

    startTransition(async () => {
      const result = await logPayment(formData);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(result.error ?? "An error occurred");
      }
    });
  };

  // Filter members by search text
  const filteredMembers = memberSearch
    ? members.filter((m) =>
        m.fullName.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : members;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>{t("logPayment")}</DialogTitle>
        </DialogHeader>

        <DialogContent className="flex flex-col gap-4">
          {/* Member select with search */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">
              {t("member")}
            </label>
            <input
              type="text"
              placeholder={tCommon("search")}
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-1 focus:ring-offset-surface"
            />
            <Select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              required
            >
              <option value="" disabled>
                {t("member")}
              </option>
              {filteredMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label={t("amount")}
            type="number"
            min="1"
            step="1"
            value={amountMkd}
            onChange={(e) => setAmountMkd(e.target.value)}
            placeholder="0"
            required
          />

          <Input
            label={t("paymentDate")}
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />

          <Input
            label={t("monthFor")}
            type="month"
            value={monthFor}
            onChange={(e) => setMonthFor(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">
              {t("notes")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-1 focus:ring-offset-surface hover:border-text-muted resize-none"
              placeholder={t("notes")}
            />
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          {success && (
            <p className="text-sm text-success font-medium">
              {t("logPayment")} - OK
            </p>
          )}
        </DialogContent>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            {tCommon("cancel")}
          </Button>
          <Button type="submit" loading={isPending} disabled={success}>
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
