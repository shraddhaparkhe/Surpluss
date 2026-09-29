import type { Catalogue, Product } from "./catalogue";

export interface EnquiryRecord {
  id: string;
  reference: string;
  catalogueId: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    priceSnapshot: number;
  }>;
}

export interface CatalogueStore {
  catalogues: Catalogue[];
  products: Product[];
  enquiries: EnquiryRecord[];
  nextEnquiryNumber: number;
  nextCatalogueNumber: number;
}

const initialStore = (): CatalogueStore => ({
  products: [
    {
      id: "p-001",
      sku: "NS-TV-43",
      name: "43-inch LED television",
      brand: "Northstar",
      category: "Electronics",
      mrp: 32000,
      offerPrice: 24500,
      availableQty: 24,
      moq: 2,
    },
    {
      id: "p-002",
      sku: "NS-CHAIR-01",
      name: "Ergonomic task chair",
      brand: "Northstar",
      category: "Furniture",
      mrp: 12500,
      offerPrice: 8400,
      availableQty: 38,
      moq: 4,
    },
    {
      id: "p-003",
      sku: "NS-LAP-14",
      name: "14-inch business laptop",
      brand: "Northstar",
      category: "Electronics",
      mrp: 88000,
      offerPrice: 68500,
      availableQty: 11,
      moq: 1,
    },
  ],
  catalogues: [
    {
      id: "cat-live",
      slug: "premium-corporate-essentials",
      title: "Premium corporate essentials",
      status: "published",
      validUntil: null,
      productIds: ["p-001", "p-002"],
    },
    {
      id: "cat-draft",
      slug: "festive-overstock-2026",
      title: "Festive overstock 2026 — Northstar pricing",
      status: "draft",
      validUntil: null,
      productIds: ["p-003"],
    },
    {
      id: "cat-expired",
      slug: "monsoon-clearance-2026",
      title: "Monsoon clearance 2026",
      status: "published",
      validUntil: "2026-08-31T23:59:59.000Z",
      productIds: ["p-001"],
    },
  ],
  enquiries: [],
  nextEnquiryNumber: 24071,
  nextCatalogueNumber: 1,
});

const storeKey = "__surplussCatalogueStore";
type StoreGlobal = typeof globalThis & { [storeKey]?: CatalogueStore };

export function getStore(): CatalogueStore {
  const scope = globalThis as StoreGlobal;
  scope[storeKey] ??= initialStore();
  return scope[storeKey];
}

export function resetStore(): void {
  (globalThis as StoreGlobal)[storeKey] = initialStore();
}