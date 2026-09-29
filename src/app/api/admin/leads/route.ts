import { NextResponse } from "next/server";
import { roleFromRequest } from "@/lib/auth";
import { getStore } from "@/lib/store";

export async function GET(request: Request) {
  if (!roleFromRequest(request)) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  return NextResponse.json({ enquiries: getStore().enquiries });
}