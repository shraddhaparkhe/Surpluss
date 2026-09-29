import { createHmac, timingSafeEqual } from "node:crypto";

export type Role = "admin" | "staff";

const sessionLifetimeSeconds = 60 * 60 * 8;

function getSessionSecret(): string | null {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  return process.env.NODE_ENV === "production" ? null : "local-only-change-this-secret";
}

export function createSessionToken(role: Role, now = Date.now()): string {
  const sessionSecret = getSessionSecret();
  if (!sessionSecret) throw new Error("SESSION_SECRET must be set in production");
  const expiresAt = Math.floor(now / 1000) + sessionLifetimeSeconds;
  const payload = `${role}.${expiresAt}`;
  const signature = createHmac("sha256", sessionSecret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function roleFromSession(token: string | undefined, now = Date.now()): Role | null {
  if (!token) return null;
  const sessionSecret = getSessionSecret();
  if (!sessionSecret) return null;
  const [role, expiryValue, signature, ...extra] = token.split(".");
  if (extra.length || (role !== "admin" && role !== "staff")) return null;
  const expiresAt = Number(expiryValue);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(now / 1000)) return null;

  const payload = `${role}.${expiresAt}`;
  const expected = createHmac("sha256", sessionSecret).update(payload).digest("hex");
  const actualBytes = Buffer.from(signature ?? "", "hex");
  const expectedBytes = Buffer.from(expected, "hex");
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) {
    return null;
  }
  return role;
}

export function roleFromRequest(request: Request): Role | null {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("catalogue_session="))
    ?.slice("catalogue_session=".length);
  if (!token) return null;
  try {
    return roleFromSession(decodeURIComponent(token));
  } catch {
    return null;
  }
}

export function credentialsMatch(email: string, password: string): Role | null {
  const normalizedEmail = email.trim().toLowerCase();
  if (process.env.NODE_ENV === "production") return null;
  if (normalizedEmail === "admin@catalogue.test" && password === "Admin#2026") return "admin";
  if (normalizedEmail === "staff@catalogue.test" && password === "Staff#2026") return "staff";
  return null;
}