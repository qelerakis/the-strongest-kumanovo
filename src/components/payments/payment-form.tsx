"use client";

import { useState, useTransition, useCallback, useRef, useEffect } from "react";
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
  const [memberSearch, setMemberSearch] = useState(
    defaultMember ? defaultMember.fullName : ""
  );
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

    if (!memberId) {
      setError(t("selectMember"));
      return;
    }

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

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectMember = (member: MemberOption) => {
    handleMemberChange(member.id);
    setMemberSearch(member.fullName);
    setIsDropdownOpen(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{t("logPayment")}</DialogTitle>
      </DialogHeader>

      <DialogContent className="flex flex-col gap-4">
        {/* Member searchable combobox */}
        <div className="flex flex-col gap-1.5" ref={dropdownRef}>
          <label className="text-sm font-medium text-text-secondary">
            {t("member")}
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder={tCommon("search")}
              value={memberSearch}
              onChange={(e) => {
                setMemberSearch(e.target.value);
                setIsDropdownOpen(true);
                // Clear selection if user edits after selecting
                if (selectedMember && e.target.value !== selectedMember.fullName) {
                  setMemberId("");
                }
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className="w-full rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-1 focus:ring-offset-surface"
              autoComplete="off"
            />
            {selectedMember && (
              <button
                type="button"
                onClick={() => {
                  setMemberId("");
                  setMemberSearch("");
                  setIsDropdownOpen(true);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-sm"
                aria-label="Clear selection"
              >
                ×
              </button>
            )}
            {isDropdownOpen && filteredMembers.length > 0 && (
              <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-surface-border bg-surface-card shadow-lg">
                {filteredMembers.map((member) => (
                  <li key={member.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectMember(member)}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover ${
                        member.id === memberId
                          ? "bg-surface-hover text-text-primary font-medium"
                          : "text-text-secondary"
                      }`}
                    >
                      {member.fullName}
                      <span className="ml-2 text-xs text-text-muted">
                        {formatMKD(member.tierPrice)}/mo
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {isDropdownOpen && memberSearch && filteredMembers.length === 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-text-muted shadow-lg">
                {tCommon("noResults")}
              </div>
            )}
          </div>
          {!memberId && memberSearch && !isDropdownOpen && (
            <p className="text-xs text-error">{t("member")}</p>
          )}
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
