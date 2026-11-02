import { z } from '@kta/service-kit';

export const RegisterSchema = z.object({
  email: z.string().email().max(160).transform((s) => s.toLowerCase()),
  password: z
    .string()
    .min(10, 'Use at least 10 characters')
    .max(128)
    .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), 'Password must contain letters and numbers'),
  fullName: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, 'Use international format, e.g. +919876543210')
    .optional(),
});
