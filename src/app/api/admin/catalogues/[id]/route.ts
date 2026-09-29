import { NextResponse } from "next/server";
import { roleFromRequest } from "@/lib/auth";
import { deleteCatalogue } from "@/lib/admin-operations";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const result = deleteCatalogue(roleFromRequest(request), id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}