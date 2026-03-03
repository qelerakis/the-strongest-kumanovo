import { describe, it, expect, vi, afterEach } from "vitest";
import {
  formatMKD,
  formatDate,
  formatTime,
  getCurrentMonth,
  cn,
  getMonthsBetween,
  incrementMonth,
} from "./utils";

describe("formatMKD", () => {
  it("formats zero", () => {
    expect(formatMKD(0)).toBe("0 MKD");
  });

  it("formats 1500 with comma separator", () => {
    expect(formatMKD(1500)).toBe("1,500 MKD");
  });

  it("formats large number 3500000 with commas", () => {
    expect(formatMKD(3500000)).toBe("3,500,000 MKD");
  });

  it("formats negative numbers", () => {
    expect(formatMKD(-500)).toBe("-500 MKD");
  });
});

describe("formatDate", () => {
  it("formats 2026-02-25 correctly", () => {
    expect(formatDate("2026-02-25")).toBe("25 Feb 2026");
  });

  it("formats 2025-12-01 correctly", () => {
    expect(formatDate("2025-12-01")).toBe("1 Dec 2025");
  });

  it("formats first day of the year", () => {
    expect(formatDate("2026-01-01")).toBe("1 Jan 2026");
  });
});

describe("formatTime", () => {
  it("converts 18:30 to 6:30 PM", () => {
    expect(formatTime("18:30")).toBe("6:30 PM");
  });

  it("converts 09:00 to 9:00 AM", () => {
    expect(formatTime("09:00")).toBe("9:00 AM");
  });

  it("converts 00:00 to 12:00 AM (midnight)", () => {
    expect(formatTime("00:00")).toBe("12:00 AM");
  });

  it("converts 12:00 to 12:00 PM (noon)", () => {
    expect(formatTime("12:00")).toBe("12:00 PM");
  });

  it("converts 01:15 to 1:15 AM", () => {
    expect(formatTime("01:15")).toBe("1:15 AM");
  });

  it("converts 23:59 to 11:59 PM", () => {
    expect(formatTime("23:59")).toBe("11:59 PM");
  });
});

describe("getCurrentMonth", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns YYYY-MM format", () => {
    const result = getCurrentMonth();
    expect(result).toMatch(/^\d{4}-\d{2}$/);
  });

  it("returns correct month for a specific date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T12:00:00"));
    expect(getCurrentMonth()).toBe("2026-02");
    vi.useRealTimers();
  });

  it("pads single-digit months with leading zero", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T12:00:00"));
    expect(getCurrentMonth()).toBe("2026-01");
    vi.useRealTimers();
  });

  it("handles December (month 12)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-12-25T12:00:00"));
    expect(getCurrentMonth()).toBe("2025-12");
    vi.useRealTimers();
  });
});

describe("cn", () => {
  it("joins multiple string classes", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters out false values", () => {
    expect(cn("base", false && "active")).toBe("base");
  });

  it("filters out null values", () => {
    expect(cn("base", null)).toBe("base");
  });

  it("filters out undefined values", () => {
    expect(cn("base", undefined)).toBe("base");
  });

  it("handles a mix of truthy and falsy values", () => {
    expect(cn("base", false, "active", null, "extra", undefined)).toBe(
      "base active extra"
    );
  });

  it("returns empty string when all values are falsy", () => {
    expect(cn(false, null, undefined)).toBe("");
  });

  it("returns empty string with no arguments", () => {
    expect(cn()).toBe("");
  });
});

describe("incrementMonth", () => {
  it("increments by 1 month within the same year", () => {
    expect(incrementMonth("2026-03", 1)).toBe("2026-04");
  });

  it("returns same month when offset is 0", () => {
    expect(incrementMonth("2026-06", 0)).toBe("2026-06");
  });

  it("increments multiple months within the same year", () => {
    expect(incrementMonth("2026-01", 5)).toBe("2026-06");
  });

  it("wraps from December to January across year boundary", () => {
    expect(incrementMonth("2026-11", 2)).toBe("2027-01");
  });

  it("wraps exactly from December to January", () => {
    expect(incrementMonth("2026-12", 1)).toBe("2027-01");
  });

  it("handles large offset spanning a full year", () => {
    expect(incrementMonth("2026-03", 12)).toBe("2027-03");
  });

  it("handles large offset spanning multiple years", () => {
    expect(incrementMonth("2025-06", 24)).toBe("2027-06");
  });

  it("pads single-digit months with leading zero", () => {
    expect(incrementMonth("2026-01", 0)).toBe("2026-01");
    expect(incrementMonth("2026-08", 1)).toBe("2026-09");
  });

  it("handles wrapping from October to February (across year)", () => {
    expect(incrementMonth("2026-10", 4)).toBe("2027-02");
  });
});

describe("getMonthsBetween", () => {
  it("returns months in a normal range", () => {
    expect(getMonthsBetween("2025-10-15", "2026-01-05")).toEqual([
      "2025-10",
      "2025-11",
      "2025-12",
      "2026-01",
    ]);
  });

  it("returns a single month when start and end are in the same month", () => {
    expect(getMonthsBetween("2026-02-01", "2026-02-28")).toEqual(["2026-02"]);
  });

  it("handles year boundary", () => {
    expect(getMonthsBetween("2025-11-01", "2026-02-15")).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });

  it("returns single month when start equals end date", () => {
    expect(getMonthsBetween("2026-03-15", "2026-03-15")).toEqual(["2026-03"]);
  });

  it("handles full year range", () => {
    const result = getMonthsBetween("2025-01-01", "2025-12-31");
    expect(result).toHaveLength(12);
    expect(result[0]).toBe("2025-01");
    expect(result[11]).toBe("2025-12");
  });
});
