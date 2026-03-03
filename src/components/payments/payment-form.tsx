"use client";

import { useState, useTransition, useCallback } from "react";
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
import { DatePicker } from "@/components/ui/date-picker";
import { logPayment } from "@/lib/actions/payments";
import { getCurrentMonth, formatMKD } from "@/lib/utils";

interface MemberOption {
  id: string;
  fullName: string;
  tierPrice: number;
}

interface PaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberOption[];
  defaultMemberId?: string;
}

/** Inner form that remounts each time the dialog opens, resetting all state. */
function PaymentFormInner({
  onClose,
  members,
  defaultMemberId,
}: Omit<PaymentFormProps, "isOpen">) {
  const t = useTranslations("payments");
  const tCommon = useTranslations("common");

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = getCurrentMonth();

  const [memberId, setMemberId] = useState(defaultMemberId ?? "");
  const [numberOfMonths, setNumberOfMonths] = useState(1);
  const defaultMember = defaultMemberId
    ? members.find((m) => m.id === defaultMemberId)
    : undefined;
  const [amountMkd, setAmountMkd] = useState(
    defaultMember ? String(defaultMember.tierPrice) : ""
  );
  const [paymentDate, setPaymentDate] = useState(today);
  const [monthFor, setMonthFor] = useState(currentMonth);
  const [notes, setNotes] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedMember = members.find((m) => m.id === memberId);
  const expectedAmount = selectedMember
    ? selectedMember.tierPrice * numberOfMonths
    : 0;

  // Auto-fill amount when member or numberOfMonths changes
  const handleMemberChange = useCallback((newMemberId: string) => {
    setMemberId(newMemberId);
    const member = members.find((m) => m.id === newMemberId);
    if (member) {
      setAmountMkd(String(member.tierPrice * numberOfMonths));
    }
  }, [members, numberOfMonths]);

  const handleMonthsChange = useCallback((newMonths: number) => {
    setNumberOfMonths(newMonths);
    if (selectedMember) {
      setAmountMkd(String(selectedMember.tierPrice * newMonths));
    }
  }, [selectedMember]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("memberId", memberId);
    formData.set("amountMkd", amountMkd);
    formData.set("paymentDate", paymentDate);
    formData.set("monthFor", monthFor);
    formData.set("numberOfMonths", String(numberOfMonths));
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
            onChange={(e) => handleMemberChange(e.target.value)}
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

        {/* Number of months */}
        <Select
          label={t("numberOfMonths")}
          value={String(numberOfMonths)}
          onChange={(e) => handleMonthsChange(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>

        {/* Amount */}
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

        {/* Expected amount hint for multi-month */}
        {numberOfMonths > 1 && selectedMember && (
          <p className="text-xs text-text-muted -mt-2">
            {t("expectedAmount", {
              amount: formatMKD(expectedAmount),
              price: formatMKD(selectedMember.tierPrice),
              months: numberOfMonths,
            })}
          </p>
        )}

        <DatePicker
          label={t("paymentDate")}
          value={paymentDate}
          onChange={setPaymentDate}
          required
        />

        <DatePicker
          label={numberOfMonths > 1 ? t("startingMonth") : t("monthFor")}
          value={monthFor}
          onChange={setMonthFor}
          mode="month"
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
          onClick={onClose}
          disabled={isPending}
        >
          {tCommon("cancel")}
        </Button>
        <Button type="submit" loading={isPending} disabled={success}>
          {tCommon("save")}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function PaymentForm({
  isOpen,
  onClose,
  members,
  defaultMemberId,
}: PaymentFormProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {isOpen && (
        <PaymentFormInner
          key={String(isOpen)}
          onClose={onClose}
          members={members}
          defaultMemberId={defaultMemberId}
        />
      )}
    </Dialog>
  );
}
