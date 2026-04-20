"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth";

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export type AuthResult = { ok: true } | { ok: false; error: string };

export async function signUp(formData: FormData): Promise<AuthResult> {
  const parsed = credsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: "Invalid email or password (min 6 chars)." };
  const { email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "That email is already registered." };
  const user = await prisma.user.create({
    data: { email, passwordHash: await bcrypt.hash(password, 10) },
  });
  await createSession({ userId: user.id, email: user.email });
  return { ok: true };
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  const parsed = credsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: "Invalid credentials." };
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return { ok: false, error: "Invalid credentials." };
  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return { ok: false, error: "Invalid credentials." };
  await createSession({ userId: user.id, email: user.email });
  return { ok: true };
}

export async function signOut(): Promise<void> {
  await destroySession();
}
