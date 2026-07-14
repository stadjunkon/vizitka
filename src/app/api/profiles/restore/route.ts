import { NextRequest, NextResponse } from "next/server";
import { findEditTokenForRestore } from "@/lib/db";
import { rateLimitOrResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limited = rateLimitOrResponse(req, "profiles:restore", 10, 60 * 60 * 1000);
  if (limited) return limited;

  const body = (await req.json()) as { slug?: string; email?: string };
  const slug = (body.slug ?? "").trim();
  const email = (body.email ?? "").trim();

  if (!slug || !email) {
    return NextResponse.json({ error: "Заполните ссылку визитки и email" }, { status: 400 });
  }

  const editToken = findEditTokenForRestore(slug, email);
  if (!editToken) {
    return NextResponse.json(
      { error: "Не найдено. Проверьте адрес визитки и email восстановления." },
      { status: 404 },
    );
  }

  return NextResponse.json({ editToken });
}
