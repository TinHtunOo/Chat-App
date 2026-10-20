import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  username: z.string().min(3).max(50),
  email: z.string().email(),
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;

export const registerInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(100),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const jwtPayloadSchema = z.object({
  sub: z.string(),
  username: z.string(),
});

export type JwtPayload = z.infer<typeof jwtPayloadSchema>;

export const authResponseSchema = z.object({
  token: z.string(),
  user: userSchema,
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
