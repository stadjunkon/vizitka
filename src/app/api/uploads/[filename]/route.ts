import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const uploadsDir = path.join(dataDir, "uploads");

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  if (filename.includes("/") || filename.includes("..")) {
    return NextResponse.json({ error: "Некорректное имя файла" }, { status: 400 });
  }

  const filePath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }

  const ext = filename.split(".").pop() ?? "";
  const bytes = fs.readFileSync(filePath);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
