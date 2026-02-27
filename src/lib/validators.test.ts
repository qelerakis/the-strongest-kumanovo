import { describe, it, expect } from "vitest";
import {
  memberSchema,
  paymentSchema,
  scheduleSchema,
  credentialsSchema,
  tierPricingSchema,
  changePasswordSchema,
} from "./validators";

describe("memberSchema", () => {
  const validMember = {
    fullName: "Stefan Petrovic",
    membershipTierId: "tier_123",
    joinDate: "2026-01-15",
  };

  it("accepts valid full data", () => {
    const result = memberSchema.safeParse({
      ...validMember,
      phone: "+389 70 123 456",
      email: "stefan@example.com",
      dateOfBirth: "1995-05-10",
      beltRank: "blue",
      notes: "Experienced fighter",
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal required fields only", () => {
    const result = memberSchema.safeParse(validMember);
    expect(result.success).toBe(true);
  });

  it("rejects missing fullName", () => {
    const result = memberSchema.safeParse({
      membershipTierId: "tier_123",
      joinDate: "2026-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty fullName", () => {
    const result = memberSchema.safeParse({
      fullName: "",
      membershipTierId: "tier_123",
      joinDate: "2026-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing membershipTierId", () => {
    const result = memberSchema.safeParse({
      fullName: "Stefan Petrovic",
      joinDate: "2026-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty membershipTierId", () => {
    const result = memberSchema.safeParse({
      fullName: "Stefan Petrovic",
      membershipTierId: "",
      joinDate: "2026-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing joinDate", () => {
    const result = memberSchema.safeParse({
      fullName: "Stefan Petrovic",
      membershipTierId: "tier_123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = memberSchema.safeParse({
      ...validMember,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("allows empty string email (form default)", () => {
    const result = memberSchema.safeParse({
      ...validMember,
      email: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all belt ranks", () => {
    const ranks = ["white", "blue", "purple", "brown", "black"] as const;
    for (const rank of ranks) {
      const result = memberSchema.safeParse({
        ...validMember,
        beltRank: rank,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid belt rank", () => {
    const result = memberSchema.safeParse({
      ...validMember,
      beltRank: "red",
    });
    expect(result.success).toBe(false);
  });
});

describe("paymentSchema", () => {
  const validPayment = {
    memberId: "member_abc",
    amountMkd: 1500,
    paymentDate: "2026-02-20",
    monthFor: "2026-02",
  };

  it("accepts valid complete data", () => {
    const result = paymentSchema.safeParse({
      ...validPayment,
      notes: "Cash payment for February",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid data without notes", () => {
    const result = paymentSchema.safeParse(validPayment);
    expect(result.success).toBe(true);
  });

  it("rejects missing memberId", () => {
    const result = paymentSchema.safeParse({
      amountMkd: validPayment.amountMkd,
      paymentDate: validPayment.paymentDate,
      monthFor: validPayment.monthFor,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty memberId", () => {
    const result = paymentSchema.safeParse({
      ...validPayment,
      memberId: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects amountMkd <= 0", () => {
    const result = paymentSchema.safeParse({
      ...validPayment,
      amountMkd: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amountMkd", () => {
    const result = paymentSchema.safeParse({
      ...validPayment,
      amountMkd: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects float amountMkd", () => {
    const result = paymentSchema.safeParse({
      ...validPayment,
      amountMkd: 1500.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects bad monthFor format (no dash)", () => {
    const result = paymentSchema.safeParse({
      ...validPayment,
      monthFor: "202602",
    });
    expect(result.success).toBe(false);
  });

  it("rejects bad monthFor format (full date)", () => {
    const result = paymentSchema.safeParse({
      ...validPayment,
      monthFor: "2026-02-01",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid YYYY-MM monthFor format", () => {
    const result = paymentSchema.safeParse({
      ...validPayment,
      monthFor: "2026-02",
    });
    expect(result.success).toBe(true);
  });
});

describe("scheduleSchema", () => {
  const validSchedule = {
    sportId: "sport_123",
    dayOfWeek: 1,
    startTime: "18:00",
  };

  it("accepts valid full data with endTime", () => {
    const result = scheduleSchema.safeParse({
      ...validSchedule,
      endTime: "19:30",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid data without endTime", () => {
    const result = scheduleSchema.safeParse(validSchedule);
    expect(result.success).toBe(true);
  });

  it("accepts empty string endTime", () => {
    const result = scheduleSchema.safeParse({
      ...validSchedule,
      endTime: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing sportId", () => {
    const result = scheduleSchema.safeParse({
      dayOfWeek: validSchedule.dayOfWeek,
      startTime: validSchedule.startTime,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty sportId", () => {
    const result = scheduleSchema.safeParse({
      ...validSchedule,
      sportId: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects dayOfWeek less than 0", () => {
    const result = scheduleSchema.safeParse({
      ...validSchedule,
      dayOfWeek: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects dayOfWeek greater than 6", () => {
    const result = scheduleSchema.safeParse({
      ...validSchedule,
      dayOfWeek: 7,
    });
    expect(result.success).toBe(false);
  });

  it("accepts dayOfWeek 0 (Sunday)", () => {
    const result = scheduleSchema.safeParse({
      ...validSchedule,
      dayOfWeek: 0,
    });
    expect(result.success).toBe(true);
  });

  it("accepts dayOfWeek 6 (Saturday)", () => {
    const result = scheduleSchema.safeParse({
      ...validSchedule,
      dayOfWeek: 6,
    });
    expect(result.success).toBe(true);
  });

  it("rejects bad startTime format", () => {
    const result = scheduleSchema.safeParse({
      ...validSchedule,
      startTime: "6:30",
    });
    expect(result.success).toBe(false);
  });

  it("rejects bad endTime format", () => {
    const result = scheduleSchema.safeParse({
      ...validSchedule,
      endTime: "7pm",
    });
    expect(result.success).toBe(false);
  });
});

describe("credentialsSchema", () => {
  it("accepts valid credentials", () => {
    const result = credentialsSchema.safeParse({
      username: "admin",
      password: "admin123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimum length username (3 chars)", () => {
    const result = credentialsSchema.safeParse({
      username: "abc",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short username (2 chars)", () => {
    const result = credentialsSchema.safeParse({
      username: "ab",
      password: "admin123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty username", () => {
    const result = credentialsSchema.safeParse({
      username: "",
      password: "admin123",
    });
    expect(result.success).toBe(false);
  });

  it("accepts minimum length password (6 chars)", () => {
    const result = credentialsSchema.safeParse({
      username: "admin",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short password (5 chars)", () => {
    const result = credentialsSchema.safeParse({
      username: "admin",
      password: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = credentialsSchema.safeParse({
      username: "admin",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("tierPricingSchema", () => {
  it("accepts valid positive integer", () => {
    const result = tierPricingSchema.safeParse({ monthlyPriceMkd: 1500 });
    expect(result.success).toBe(true);
  });

  it("accepts large value", () => {
    const result = tierPricingSchema.safeParse({ monthlyPriceMkd: 50000 });
    expect(result.success).toBe(true);
  });

  it("rejects zero", () => {
    const result = tierPricingSchema.safeParse({ monthlyPriceMkd: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative value", () => {
    const result = tierPricingSchema.safeParse({ monthlyPriceMkd: -100 });
    expect(result.success).toBe(false);
  });

  it("rejects float value", () => {
    const result = tierPricingSchema.safeParse({ monthlyPriceMkd: 1500.5 });
    expect(result.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  const validData = {
    currentPassword: "OldPass123",
    newPassword: "NewPass456",
    confirmPassword: "NewPass456",
  };

  it("accepts valid matching passwords", () => {
    const result = changePasswordSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects empty current password", () => {
    const result = changePasswordSchema.safeParse({
      ...validData,
      currentPassword: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short new password (5 chars)", () => {
    const result = changePasswordSchema.safeParse({
      ...validData,
      newPassword: "12345",
      confirmPassword: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("accepts minimum length new password (6 chars)", () => {
    const result = changePasswordSchema.safeParse({
      ...validData,
      newPassword: "123456",
      confirmPassword: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty confirm password", () => {
    const result = changePasswordSchema.safeParse({
      ...validData,
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = changePasswordSchema.safeParse({
      ...validData,
      newPassword: "NewPass456",
      confirmPassword: "DifferentPass789",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("confirmPassword");
    }
  });

  it("rejects when all fields are empty", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
  });
});
