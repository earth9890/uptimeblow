import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, sessions, oauthAccounts } from "../db/schema/index.js";

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

// ─── Registration ───────────────────────────────────
export async function registerUser(
  email: string,
  name: string,
  password: string
) {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const emailVerifyToken = crypto.randomBytes(32).toString("hex");

  const [user] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      name,
      passwordHash,
      emailVerifyToken,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      plan: users.plan,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    });

  return { user: user!, emailVerifyToken };
}

// ─── Login ──────────────────────────────────────────
export async function loginUser(email: string, password: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user || !user.passwordHash) {
    throw new Error("Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid email or password");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

// ─── Refresh Tokens ─────────────────────────────────
export async function createRefreshToken(userId: string) {
  const token = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await db.insert(sessions).values({
    userId,
    refreshToken: token,
    expiresAt,
  });

  return token;
}

export async function validateRefreshToken(token: string) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.refreshToken, token))
    .limit(1);

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await db.delete(sessions).where(eq(sessions.id, session.id));
    }
    return null;
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      plan: users.plan,
      avatarUrl: users.avatarUrl,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return user || null;
}

export async function revokeRefreshToken(token: string) {
  await db.delete(sessions).where(eq(sessions.refreshToken, token));
}

export async function revokeAllUserSessions(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

// ─── Email Verification ─────────────────────────────
export async function verifyEmail(token: string) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.emailVerifyToken, token))
    .limit(1);

  if (!user) {
    throw new Error("Invalid verification token");
  }

  await db
    .update(users)
    .set({ emailVerified: true, emailVerifyToken: null })
    .where(eq(users.id, user.id));

  return user.id;
}

// ─── Password Reset ─────────────────────────────────
export async function requestPasswordReset(email: string) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    // Don't reveal if email exists
    return null;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetExpires = new Date();
  resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

  await db
    .update(users)
    .set({
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    })
    .where(eq(users.id, user.id));

  return { userId: user.id, resetToken };
}

export async function resetPassword(token: string, newPassword: string) {
  const [user] = await db
    .select({ id: users.id, passwordResetExpires: users.passwordResetExpires })
    .from(users)
    .where(eq(users.passwordResetToken, token))
    .limit(1);

  if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
    throw new Error("Invalid or expired reset token");
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await db
    .update(users)
    .set({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    })
    .where(eq(users.id, user.id));

  // Revoke all sessions on password reset
  await revokeAllUserSessions(user.id);

  return user.id;
}

// ─── OAuth ──────────────────────────────────────────
export async function findOrCreateOAuthUser(
  provider: string,
  providerId: string,
  email: string,
  name: string,
  avatarUrl?: string
) {
  // Check if OAuth account already linked
  const [existing] = await db
    .select({ userId: oauthAccounts.userId })
    .from(oauthAccounts)
    .where(eq(oauthAccounts.providerId, providerId))
    .limit(1);

  if (existing) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        plan: users.plan,
        avatarUrl: users.avatarUrl,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(eq(users.id, existing.userId))
      .limit(1);

    return user!;
  }

  // Check if user exists with this email
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existingUser) {
    // Link OAuth account to existing user
    await db.insert(oauthAccounts).values({
      userId: existingUser.id,
      provider,
      providerId,
    });

    // Mark email as verified since OAuth providers verify emails
    if (!existingUser.emailVerified) {
      await db
        .update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, existingUser.id));
    }

    return {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      plan: existingUser.plan,
      avatarUrl: existingUser.avatarUrl,
      emailVerified: true,
    };
  }

  // Create new user + OAuth account
  const [newUser] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      name,
      avatarUrl: avatarUrl || null,
      emailVerified: true, // OAuth providers verify emails
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      plan: users.plan,
      avatarUrl: users.avatarUrl,
      emailVerified: users.emailVerified,
    });

  await db.insert(oauthAccounts).values({
    userId: newUser!.id,
    provider,
    providerId,
  });

  return newUser!;
}

// ─── Get User ───────────────────────────────────────
export async function getUserById(id: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      plan: users.plan,
      avatarUrl: users.avatarUrl,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user || null;
}

// ─── Update User ────────────────────────────────────
export async function updateUser(
  id: string,
  data: { name?: string; avatarUrl?: string }
) {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      plan: users.plan,
      avatarUrl: users.avatarUrl,
      emailVerified: users.emailVerified,
    });

  return user || null;
}

// ─── Change Password ────────────────────────────────
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || !user.passwordHash) {
    throw new Error("Cannot change password for OAuth-only account");
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error("Current password is incorrect");
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
