import { NextResponse } from "next/server";
import { validateEnquiry, type EnquiryInput } from "@/lib/catalogue";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  const input = (await request.json().catch(() => null)) as
    | (EnquiryInput & { slug?: string })
    | null;
  if (!input || typeof input.slug !== "string") {
    return NextResponse.json({ error: "Invalid enquiry" }, { status: 400 });
  }

  const store = getStore();
  const catalogue = store.catalogues.find((item) => item.slug === input.slug);
  if (!catalogue) return NextResponse.json({ error: "Catalogue not found" }, { status: 404 });

  const validation = validateEnquiry(input, catalogue, store.products);
  if (validation.errors.length) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const number = store.nextEnquiryNumber++;
  const enquiry = {
    id: `enq-${number}`,
    reference: `ENQ-${number}`,
    catalogueId: catalogue.id,
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    createdAt: new Date().toISOString(),
    items: validation.items.map(({ product, quantity, priceSnapshot }) => ({
      productId: product.id,
      productName: product.name,
      quantity,
      priceSnapshot,
    })),
  };
  store.enquiries.unshift(enquiry);
  return NextResponse.json({ reference: enquiry.reference }, { status: 201 });
}