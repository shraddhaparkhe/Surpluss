import { afterEach, describe, expect, it } from "vitest";
import { createCatalogue, deleteCatalogue, publishCatalogue } from "./admin-operations";
import { resetStore } from "./store";

afterEach(() => resetStore());

describe("admin operations", () => {
  it("allows staff to create drafts but not publish or delete catalogues", () => {
    const created = createCatalogue("staff", "New buyer list", "new-buyer-list");
    expect(created).toMatchObject({ ok: true, value: { id: "cat-new-1" } });
    expect(publishCatalogue("staff", "cat-draft")).toMatchObject({ ok: false, status: 403 });
    expect(deleteCatalogue("staff", "cat-draft")).toMatchObject({ ok: false, status: 403 });
  });

  it("requires authentication, and admin mutations reject unknown IDs", () => {
    expect(createCatalogue(null, "New list", "new-list")).toMatchObject({ ok: false, status: 401 });
    expect(publishCatalogue("admin", "wrong-id")).toMatchObject({ ok: false, status: 404 });
    expect(deleteCatalogue("admin", "wrong-id")).toMatchObject({ ok: false, status: 404 });
  });

  it("allows an admin to publish and remove the intended catalogue", () => {
    expect(publishCatalogue("admin", "cat-draft")).toMatchObject({ ok: true });
    expect(deleteCatalogue("admin", "cat-expired")).toMatchObject({ ok: true, value: { id: "cat-expired" } });
  });
});