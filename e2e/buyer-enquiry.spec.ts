import { expect, test } from "@playwright/test";

test("buyer submits an enquiry that appears in the admin leads inbox", async ({ page }) => {
  const buyer = {
    name: "Jordan QA",
    email: `jordan.qa.${Date.now()}@example.test`,
    phone: "+91 98765 43210",
  };

  await page.goto("/catalogue/premium-corporate-essentials");
  await expect(page.getByRole("heading", { name: "Premium corporate essentials" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "43-inch LED television" })).toBeVisible();
  await page.getByRole("button", { name: "Add to enquiry" }).first().click();
  await expect(page.getByLabel("Quantity for 43-inch LED television")).toHaveValue("2");

  await page.getByLabel("Your name").fill(buyer.name);
  await page.getByLabel("Work email").fill(buyer.email);
  await page.getByLabel("Phone").fill(buyer.phone);
  await page.getByRole("button", { name: "Submit enquiry" }).click();
  const confirmation = page.getByRole("status");
  await expect(confirmation).toContainText("Enquiry submitted");
  const reference = (await confirmation.textContent())?.match(/ENQ-\d+/)?.[0];
  expect(reference).toBeTruthy();

  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("admin@catalogue.test");
  await page.getByLabel("Password").fill("Admin#2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/leads$/);
  await expect(page.getByRole("heading", { name: "Buyer enquiries" })).toBeVisible();
  const leadRow = page.getByRole("row").filter({ hasText: buyer.email });
  await expect(leadRow).toContainText(reference!);
  await expect(leadRow).toContainText("43-inch LED television · 2 × ₹24,500");
});