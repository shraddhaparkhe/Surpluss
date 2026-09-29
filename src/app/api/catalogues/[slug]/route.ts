import { NextResponse } from "next/server";
import { catalogueLifecycle } from "@/lib/catalogue";
import { getStore } from "@/lib/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const store = getStore();
  const catalogue = store.catalogues.find((item) => item.slug === slug);
  if (!catalogue || catalogueLifecycle(catalogue) !== "published") {
    return NextResponse.json({ error: "Catalogue not found" }, { status: 404 });
  }

  const products = catalogue.productIds
    .map((id) => store.products.find((product) => product.id === id))
    .filter((product) => product !== undefined);
  return NextResponse.json({ catalogue, products }, { headers: { "Cache-Control": "no-store" } });
}