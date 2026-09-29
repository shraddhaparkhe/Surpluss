import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { createSessionToken, type Role } from "@/lib/auth";
import { resetStore } from "@/lib/store";
import {
  createCatalogueAction,
  deleteCatalogueAction,
  publishCatalogueAction,
} from "./actions";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

function setSession(role?: Role) {
  const token = role ? createSessionToken(role) : undefined;
  vi.mocked(cookies).mockResolvedValue({
    get: () => (token ? { value: token } : undefined),
  } as unknown as Awaited<ReturnType<typeof cookies>>);
}

beforeEach(() => resetStore());
afterEach(() => vi.resetAllMocks());

describe("catalogue server actions", () => {
  it("requires a session to create a catalogue", async () => {
    setSession();
    await expect(createCatalogueAction("Buyer list", "buyer-list")).resolves.toMatchObject({
      ok: false,
      status: 401,
    });
  });

  it("allows staff to create drafts but rejects publishing and deletion", async () => {
    setSession("staff");
    await expect(createCatalogueAction("Buyer list", "buyer-list")).resolves.toMatchObject({
      ok: true,
      value: { slug: "buyer-list" },
    });
    await expect(publishCatalogueAction("cat-draft")).resolves.toMatchObject({ ok: false, status: 403 });
    await expect(deleteCatalogueAction("cat-draft")).resolves.toMatchObject({ ok: false, status: 403 });
  });

  it("allows admin publish/delete and refuses a catalogue ID that does not exist", async () => {
    setSession("admin");
    await expect(publishCatalogueAction("cat-draft")).resolves.toMatchObject({ ok: true });
    await expect(deleteCatalogueAction("cat-expired")).resolves.toMatchObject({ ok: true });
    await expect(publishCatalogueAction("other-catalogue")).resolves.toMatchObject({
      ok: false,
      status: 404,
    });
  });
});