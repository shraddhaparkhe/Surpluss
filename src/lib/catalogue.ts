export type CatalogueStatus = "draft" | "published";

export interface Catalogue {
  id: string;
  slug: string;
  title: string;
  status: CatalogueStatus;
  validUntil: string | null;
  productIds: string[];
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  mrp: number;
  offerPrice: number;
  availableQty: number;
  moq: number;
}

export interface ImportedProduct {
  sku: string;
  name: string;
  brand: string;
  category: string;
  mrp: number;
  offerPrice: number;
  availableQty: number;
  moq: number;
}

export type ImportField = keyof ImportedProduct;
export type ImportMapping = Partial<Record<ImportField, string>>;

export interface EnquiryItemInput {
  productId: string;
  quantity: number;
}

export interface EnquiryInput {
  name: string;
  email: string;
  phone: string;
  items: EnquiryItemInput[];
}

export interface ValidatedEnquiryItem extends EnquiryItemInput {
  product: Product;
  priceSnapshot: number;
}

export function discountPercent(mrp: number, offerPrice: number): number {
  if (!Number.isFinite(mrp) || mrp <= 0) {
    throw new Error("MRP must be a positive number");
  }
  if (!Number.isFinite(offerPrice) || offerPrice < 0 || offerPrice > mrp) {
    throw new Error("Offer price must be between zero and MRP");
  }
  return Math.round(((mrp - offerPrice) / mrp) * 100);
}

export function catalogueLifecycle(
  catalogue: Catalogue,
  now = new Date(),
): "draft" | "published" | "expired" {
  if (catalogue.status === "draft") return "draft";
  if (catalogue.validUntil && new Date(catalogue.validUntil) < now) {
    return "expired";
  }
  return "published";
}

export function mapImportRow(
  row: Record<string, string>,
  mapping: ImportMapping,
): Record<ImportField, string> {
  const fields: ImportField[] = [
    "sku",
    "name",
    "brand",
    "category",
    "mrp",
    "offerPrice",
    "availableQty",
    "moq",
  ];
  return Object.fromEntries(
    fields.map((field) => [field, row[mapping[field] ?? ""]?.trim() ?? ""]),
  ) as Record<ImportField, string>;
}

function parseMoney(value: string): number | null {
  const normalized = value.replace(/[₹,\s]/g, "").replace(/\/piece$/i, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

function parseWholeNumber(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const amount = Number(value);
  return Number.isSafeInteger(amount) ? amount : null;
}

export function validateImportedProduct(
  row: Record<ImportField, string>,
): { product?: ImportedProduct; errors: string[] } {
  const errors: string[] = [];
  const sku = row.sku.trim();
  const name = row.name.trim();
  const brand = row.brand.trim();
  const category = row.category.trim();
  const mrp = parseMoney(row.mrp);
  const offerPrice = parseMoney(row.offerPrice);
  const availableQty = parseWholeNumber(row.availableQty);
  const moq = parseWholeNumber(row.moq);

  if (!sku) errors.push("SKU is required");
  if (!name) errors.push("Name is required");
  if (!brand) errors.push("Brand is required");
  if (!category) errors.push("Category is required");
  if (mrp === null || mrp <= 0) errors.push("MRP must be a positive amount");
  if (offerPrice === null || offerPrice < 0) {
    errors.push("Offer price must be a non-negative amount");
  } else if (mrp !== null && offerPrice > mrp) {
    errors.push("Offer price cannot exceed MRP");
  }
  if (availableQty === null || availableQty <= 0) {
    errors.push("Available quantity must be a positive whole number");
  }
  if (moq === null || moq <= 0) errors.push("MOQ must be a positive whole number");
  else if (availableQty !== null && moq > availableQty) {
    errors.push("MOQ cannot exceed available quantity");
  }

  if (
    errors.length > 0 ||
    mrp === null ||
    offerPrice === null ||
    availableQty === null ||
    moq === null
  ) {
    return { errors };
  }

  return {
    product: { sku, name, brand, category, mrp, offerPrice, availableQty, moq },
    errors,
  };
}

export function validateEnquiry(
  input: EnquiryInput,
  catalogue: Catalogue,
  products: Product[],
  now = new Date(),
): { errors: string[]; items: ValidatedEnquiryItem[] } {
  const errors: string[] = [];
  const items: ValidatedEnquiryItem[] = [];
  const lifecycle = catalogueLifecycle(catalogue, now);

  if (lifecycle !== "published") errors.push("Catalogue is not available for enquiries");
  if (!input.name.trim()) errors.push("Name is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.push("A valid email is required");
  }
  if (!/^[+\d][\d\s()-]{7,19}$/.test(input.phone.trim())) {
    errors.push("A valid phone number is required");
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    errors.push("Select at least one product");
  }

  const quantitiesByProduct = new Map<string, number>();
  for (const item of input.items ?? []) {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (!catalogue.productIds.includes(item.productId) || !product) {
      errors.push("Product is not part of this catalogue");
      continue;
    }
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
      errors.push(`${product.name}: quantity must be a positive whole number`);
      continue;
    }
    quantitiesByProduct.set(
      item.productId,
      (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity,
    );
  }

  for (const [productId, quantity] of quantitiesByProduct) {
    const product = products.find((candidate) => candidate.id === productId)!;
    if (quantity < product.moq) {
      errors.push(`${product.name}: quantity must be at least MOQ (${product.moq})`);
      continue;
    }
    if (quantity > product.availableQty) {
      errors.push(`${product.name}: quantity exceeds available stock`);
      continue;
    }
    items.push({ productId, quantity, product, priceSnapshot: product.offerPrice });
  }

  return { errors, items: errors.length === 0 ? items : [] };
}