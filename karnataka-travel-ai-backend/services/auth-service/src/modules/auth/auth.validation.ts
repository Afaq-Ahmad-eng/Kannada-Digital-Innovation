import { z } from '@kta/service-kit';

export const LoginSchema = z.object({
  email: z.string().email().transform((s) => s.toLowerCase()),
  password: z.string().min(1).max(256),
});

export const VerifySchema = z.object({ token: z.string().min(10) });
