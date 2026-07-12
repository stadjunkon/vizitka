import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Разовый служебный сброс демо-данных. Работает ТОЛЬКО если задан ADMIN_SECRET
// и он совпадает с заголовком x-admin-secret. Без переменной окружения — всегда 403.
export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers.get("x-admin-secret") !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM works").run();
    db.prepare("DELETE FROM profiles").run();
  });
  tx();
  return NextResponse.json({ reset: true });
}
