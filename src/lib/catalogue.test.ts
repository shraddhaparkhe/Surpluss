import { describe, expect, it } from "vitest";
import {
  catalogueLifecycle,
  discountPercent,
  mapImportRow,
  validateEnquiry,
  validateImportedProduct,
  type Catalogue,
  type Product,
} from "./catalogue";

const liveCatalogue: Catalogue = {
  id: "cat-live",
  slug: "live",
  title: "Live catalogue",
  status: "published",
  validUntil: null,
  productIds: ["p-1"],
};

const product: Product = {
  id: "p-1",
  sku: "TV-01",
  name: "LED television",
  brand: "Northstar",
  category: "Electronics",
  mrp: 25000,
  offerPrice: 20000,
  availableQty: 12,
  moq: 2,
};

describe("catalogue domain rules", () => {
  it("calculates discount from MRP and rejects an invalid offer price", () => {
    expect(discountPercent(25000, 20000)).toBe(20);
    expect(() => discountPercent(0, 0)).toThrow("MRP must be a positive number");
    expect(() => discountPercent(100, 101)).toThrow("Offer price must be between zero and MRP");
  });

  it("keeps draft private and treats the validity boundary as expired", () => {
    const now = new Date("2026-09-29T12:00:00.000Z");
    expect(catalogueLifecycle({ ...liveCatalogue, status: "draft" }, now)).toBe("draft");
    expect(
      catalogueLifecycle({ ...liveCatalogue, validUntil: "2026-09-29T11:59:59.000Z" }, now),
    ).toBe("expired");
    expect(
      catalogueLifecycle({ ...liveCatalogue, validUntil: "2026-09-29T12:00:00.000Z" }, now),
    ).toBe("published");
  });

  it("maps seller column names and parses rupee amounts", () => {
    const row = mapImportRow(
      {
        "Item code": " TV-02 ",
        "Product title": "LED television",
        Brand: "Northstar",
        Category: "Electronics",
        MRP: "₹1,20,000 /piece",
        Offer: "₹99,000",
        Stock: "8",
        Minimum: "2",
      },
      {
        sku: "Item code",
        name: "Product title",
        brand: "Brand",
        category: "Category",
        mrp: "MRP",
        offerPrice: "Offer",
        availableQty: "Stock",
        moq: "Minimum",
      },
    );

    expect(validateImportedProduct(row)).toEqual({
      product: {
        sku: "TV-02",
        name: "LED television",
        brand: "Northstar",
        category: "Electronics",
        mrp: 120000,
        offerPrice: 99000,
        availableQty: 8,
        moq: 2,
      },
      errors: [],
    });
  });

  it("rejects an enquiry below MOQ, above stock, or for another catalogue's product", () => {
    const buyer = { name: "A Buyer", email: "buyer@example.com", phone: "+91 98765 43210" };
    const belowMoq = validateEnquiry(
      { ...buyer, items: [{ productId: "p-1", quantity: 1 }] },
      liveCatalogue,
      [product],
    );
    const aboveStock = validateEnquiry(
      { ...buyer, items: [{ productId: "p-1", quantity: 13 }] },
      liveCatalogue,
      [product],
    );
    const foreignProduct = validateEnquiry(
      { ...buyer, items: [{ productId: "p-2", quantity: 2 }] },
      liveCatalogue,
      [{ ...product, id: "p-2" }],
    );

    expect(belowMoq.errors).toContain("LED television: quantity must be at least MOQ (2)");
    expect(aboveStock.errors).toContain("LED television: quantity exceeds available stock");
    expect(foreignProduct.errors).toContain("Product is not part of this catalogue");
  });

  it("aggregates repeated lines before checking available stock", () => {
    const result = validateEnquiry(
      {
        name: "A Buyer",
        email: "buyer@example.com",
        phone: "+91 98765 43210",
        items: [
          { productId: "p-1", quantity: 8 },
          { productId: "p-1", quantity: 8 },
        ],
      },
      liveCatalogue,
      [product],
    );

    expect(result.errors).toContain("LED television: quantity exceeds available stock");
    expect(result.items).toEqual([]);
  });
});