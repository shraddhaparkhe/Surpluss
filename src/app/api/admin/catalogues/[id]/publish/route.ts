import { NextResponse } from "next/server";
import { roleFromRequest } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { publishCatalogue } from "@/lib/admin-operations";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const result = publishCatalogue(roleFromRequest(request), id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  const catalogue = getStore().catalogues.find((item) => item.id === id);
  return NextResponse.json({ catalogue });
}