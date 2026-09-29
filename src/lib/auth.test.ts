import { describe, expect, it } from "vitest";
import { createSessionToken, roleFromSession } from "./auth";

describe("signed role sessions", () => {
  it("accepts a valid session and rejects tampered or expired tokens", () => {
    const now = Date.parse("2026-09-29T12:00:00.000Z");
    const token = createSessionToken("staff", now);
    const [, expiry, signature] = token.split(".");
    const tamperedRole = `admin.${expiry}.${signature}`;

    expect(roleFromSession(token, now)).toBe("staff");
    expect(roleFromSession(tamperedRole, now)).toBeNull();
    expect(roleFromSession(token, now + 8 * 60 * 60 * 1000)).toBeNull();
  });
});