import { NextRequest, NextResponse } from "next/server";

interface Bucket {
  count: number;
  resetAt: number;
}

// Локальный лимитер в памяти процесса. Railway-сервис у нас в одном
// инстансе, поэтому Map достаточно — не нужен Redis/внешний сервис.
const buckets = new Map<string, Bucket>();

function cleanup(now: number) {
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Возвращает 429-ответ, если лимит превышен, иначе null. */
export function rateLimitOrResponse(
  req: NextRequest,
  name: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const now = Date.now();
  if (Math.random() < 0.02) cleanup(now);

  const key = `${name}:${getClientIp(req)}`;
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  if (bucket.count >= limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте позже." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }
  bucket.count += 1;
  return null;
}
