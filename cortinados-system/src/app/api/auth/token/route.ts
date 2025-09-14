import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  // Lê o JWT que o NextAuth colocou no cookie
  const raw = await getToken({
    req,
    raw: true, // retorna o JWT cru (string)
    secureCookie: process.env.NODE_ENV === "production",
  });

  if (!raw) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ token: raw, tokenType: "Bearer" });
}
