import { z } from "zod";

export const loginBodySchema = z.object({
  login: z.string().min(1), // username or email
  password: z.string().min(1),
});

export const refreshBodySchema = z.object({
  refresh_token: z.string().min(1),
});

export const changePasswordBodySchema = z.object({
  old_password: z.string().min(1),
  new_password: z.string().min(8),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type RefreshBody = z.infer<typeof refreshBodySchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;
