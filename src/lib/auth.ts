import crypto from "crypto";
import type { NextRequest } from "next/server";
import { connectDB } from "./db.ts";
import User, { type IUser } from "../models/User.ts";

export const SESSION_COOKIE_NAME = "ecoloop_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "ecoloop-bangladesh-multi-user-session-secret-2026";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface SessionPayload {
  userId: string;
  email: string;
  role: "citizen" | "admin";
  cardId: string;
  exp: number;
}

/**
 * Hash a plain password using Node.js native scrypt with a cryptographic salt.
 * Format: <salt-hex>:<hash-hex>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verify a plain password against the stored salt:hash string using constant-time comparison.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 2) return false;
    const [salt, key] = parts;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, "hex");
    return crypto.timingSafeEqual(derivedKey, keyBuffer);
  } catch {
    return false;
  }
}

/**
 * Creates a signed, tamper-proof session token.
 */
export function createSessionToken(data: {
  userId: string;
  email: string;
  role: "citizen" | "admin";
  cardId: string;
}): string {
  const payload: SessionPayload = {
    ...data,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const json = JSON.stringify(payload);
  const base64Payload = Buffer.from(json).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(base64Payload)
    .digest("base64url");

  return `${base64Payload}.${signature}`;
}

/**
 * Validates a signed session token. Returns the payload if valid and not expired, null otherwise.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [base64Payload, signature] = parts;

    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(base64Payload)
      .digest("base64url");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature, "utf8"),
        Buffer.from(expectedSignature, "utf8")
      )
    ) {
      return null;
    }

    const json = Buffer.from(base64Payload, "base64url").toString("utf8");
    const payload = JSON.parse(json) as SessionPayload;

    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Helper to extract the session token from a NextRequest or standard Request headers.
 */
export function getSessionTokenFromRequest(request: NextRequest | Request): string | null {
  if ("cookies" in request && typeof request.cookies.get === "function") {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME);
    if (cookie?.value) return cookie.value;
  }

  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));

  if (!match) return null;
  return decodeURIComponent(match.substring(SESSION_COOKIE_NAME.length + 1));
}

/**
 * Retrieve the currently authenticated User document from database using the request session.
 */
export async function getAuthenticatedUser(
  request: NextRequest | Request
): Promise<IUser | null> {
  const token = getSessionTokenFromRequest(request);
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload?.userId) return null;

  await connectDB();
  const user = await User.findById(payload.userId);
  return user;
}

/**
 * Cookie options for setting the authentication session.
 */
export const sessionCookieOptions = {
  name: SESSION_COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
