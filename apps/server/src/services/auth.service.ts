import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type {
  AuthResponse,
  JwtPayload,
  LoginInput,
  RegisterInput,
  User,
} from "@chat/shared";
import { prisma } from "../config/db.js";
import { env } from "../config/env.js";

const SALT_ROUNDS = 10;

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

function toPublicUser(user: {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}): User {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

function signToken(user: { id: string; username: string }): string {
  const payload: JwtPayload = { sub: user.id, username: user.username };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
  });

  if (existing) {
    throw new AuthError("Email or username already in use", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      passwordHash,
    },
  });

  return { token: signToken(user), user: toPublicUser(user) };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    throw new AuthError("Invalid credentials", 401);
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);

  if (!valid) {
    throw new AuthError("Invalid credentials", 401);
  }

  return { token: signToken(user), user: toPublicUser(user) };
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    throw new AuthError("Invalid or expired token", 401);
  }
}
