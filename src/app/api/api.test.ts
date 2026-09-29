import { afterEach, describe, expect, it } from "vitest";
import { POST as login } from "./auth/login/route";
import { GET as getCatalogue } from "./catalogues/[slug]/route";
import { POST as createEnquiry } from "./enquiries/route";
import { GET as getLeads } from "./admin/leads/route";
import { POST as publishCatalogue } from "./admin/catalogues/[id]/publish/route";
import { DELETE as deleteCatalogue } from "./admin/catalogues/[id]/route";
import { createSessionToken } from "@/lib/auth";
import { resetStore } from "@/lib/store";

const request = (url: string, method = "GET", body?: unknown, role?: "admin" | "staff") =>
  new Request(url, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(role ? { cookie: `catalogue_session=${createSessionToken(role)}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

afterEach(() => resetStore());

describe("catalogue and admin route access", () => {
  it("does not expose draft or expired catalogue contents publicly", async () => {
    for (const slug of ["festive-overstock-2026", "monsoon-clearance-2026"]) {
      const response = await getCatalogue(request(`http://local/api/catalogues/${slug}`), {
        params: Promise.resolve({ slug }),
      });
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "Catalogue not found" });
    }
  });

  it("requires a session for leads and restricts publishing/deletion to admins", async () => {
    expect((await getLeads(request("http://local/api/admin/leads"))).status).toBe(401);
    expect(
      (
        await publishCatalogue(
          request("http://local/api/admin/catalogues/cat-draft/publish", "POST", {}),
          { params: Promise.resolve({ id: "cat-draft" }) },
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await publishCatalogue(
          request("http://local/api/admin/catalogues/cat-draft/publish", "POST", {}, "staff"),
          { params: Promise.resolve({ id: "cat-draft" }) },
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await deleteCatalogue(
          request("http://local/api/admin/catalogues/cat-draft", "DELETE", undefined, "staff"),
          { params: Promise.resolve({ id: "cat-draft" }) },
        )
      ).status,
    ).toBe(403);
  });

  it("authenticates the seeded local account and issues an HttpOnly session", async () => {
    const response = await login(
      request(
        "http://local/api/auth/login",
        "POST",
        { email: "staff@catalogue.test", password: "Staff#2026" },
      ),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(await response.json()).toEqual({ role: "staff" });
  });

  it("ignores tampered prices and rejects products outside the selected catalogue", async () => {
    const valid = await createEnquiry(
      request("http://local/api/enquiries", "POST", {
        slug: "premium-corporate-essentials",
        name: "Buyer",
        email: "buyer@example.com",
        phone: "+91 98765 43210",
        items: [{ productId: "p-001", quantity: 2, priceSnapshot: 1 }],
      }),
    );
    expect(valid.status).toBe(201);
    const leads = await getLeads(request("http://local/api/admin/leads", "GET", undefined, "admin"));
    const [savedLead] = (await leads.json()).enquiries;
    expect(savedLead.items[0].priceSnapshot).toBe(24500);

    const rejected = await createEnquiry(
      request("http://local/api/enquiries", "POST", {
        slug: "premium-corporate-essentials",
        name: "Buyer",
        email: "buyer@example.com",
        phone: "+91 98765 43210",
        items: [{ productId: "p-003", quantity: 1 }],
      }),
    );
    expect(rejected.status).toBe(400);
    expect(await rejected.json()).toMatchObject({ errors: ["Product is not part of this catalogue"] });
  });

  it("treats malformed session cookies as signed out", async () => {
    const response = await getLeads(
      new Request("http://local/api/admin/leads", { headers: { cookie: "catalogue_session=%ZZ" } }),
    );
    expect(response.status).toBe(401);
  });
});