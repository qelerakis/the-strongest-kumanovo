import { z } from "zod";

export const memberSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  dateOfBirth: z.string().optional(),
  membershipTierId: z.string().min(1, "Membership tier is required"),
  beltRank: z
    .enum(["white", "blue", "purple", "brown", "black"])
    .optional(),
  joinDate: z.string().min(1, "Join date is required"),
  notes: z.string().optional(),
});

export type MemberFormData = z.infer<typeof memberSchema>;

export const paymentSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  amountMkd: z.number().int().positive("Amount must be a positive integer"),
  paymentDate: z.string().min(1, "Payment date is required"),
  monthFor: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Must be in YYYY-MM format"),
  notes: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

export const scheduleSchema = z.object({
  sportId: z.string().min(1, "Sport is required"),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Must be in HH:MM format"),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Must be in HH:MM format")
    .optional()
    .or(z.literal("")),
});

export type ScheduleFormData = z.infer<typeof scheduleSchema>;

export const credentialsSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type CredentialsFormData = z.infer<typeof credentialsSchema>;

export const tierPricingSchema = z.object({
  monthlyPriceMkd: z
    .number()
    .int()
    .positive("Price must be a positive integer"),
});

export type TierPricingFormData = z.infer<typeof tierPricingSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
