import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";

export const runtime = "nodejs";

const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const uploadsDir = path.join(dataDir, "uploads");

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_DIM = 1600;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Неподдерживаемый тип файла" }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "Файл больше 15МБ" }, { status: 400 });
  }

  fs.mkdirSync(uploadsDir, { recursive: true });
  const input = Buffer.from(await file.arrayBuffer());

  let output: Buffer;
  let ext: string;
  try {
    if (file.type === "image/gif") {
      // GIF не трогаем — сохраняем анимацию как есть.
      output = input;
      ext = "gif";
    } else {
      // Уменьшаем до разумного размера и жмём в webp — легче на мобильном.
      output = await sharp(input)
        .rotate() // учесть EXIF-ориентацию
        .resize({ width: MAX_DIM, height: MAX_DIM, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      ext = "webp";
    }
  } catch {
    return NextResponse.json({ error: "Не удалось обработать изображение" }, { status: 400 });
  }

  const filename = `${randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(uploadsDir, filename), output);

  return NextResponse.json({ url: `/api/uploads/${filename}` });
}
