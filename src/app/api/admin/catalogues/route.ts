import { NextResponse } from "next/server";
import { roleFromRequest } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { createCatalogue } from "@/lib/admin-operations";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { title?: string; slug?: string } | null;
  const result = createCatalogue(roleFromRequest(request), body?.title ?? "", body?.slug ?? "");
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  const catalogue = getStore().catalogues.find((item) => item.id === result.value.id);
  return NextResponse.json({ catalogue }, { status: 201 });
}