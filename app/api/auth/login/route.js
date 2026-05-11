import { NextResponse } from "next/server";
import { signToken, checkCredentials, COOKIE } from "@/lib/auth";

export async function POST(req) {
  const { login, password } = await req.json();
  if (!checkCredentials(login, password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const token = await signToken({ login, role: "admin" });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
