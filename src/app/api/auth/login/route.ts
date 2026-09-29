import { NextResponse } from "next/server";
import { createSessionToken, credentialsMatch } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;
  const role = body?.email && body.password ? credentialsMatch(body.email, body.password) : null;
  if (!role) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const response = NextResponse.json({ role });
  response.cookies.set("catalogue_session", createSessionToken(role), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}