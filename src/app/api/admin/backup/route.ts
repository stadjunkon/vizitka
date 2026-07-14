import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import { backupDatabaseTo } from "@/lib/db";

// Служебная выгрузка бэкапа (БД + загруженные фото) одним архивом.
// Отдельный секрет от ADMIN_SECRET (который открывает /api/admin/reset) —
// этот эндпоинт только читает данные, поэтому его можно держать включённым
// постоянно для регулярных бэкапов, не оставляя навсегда доступным сброс БД.
export async function GET(req: NextRequest) {
  const secret = process.env.BACKUP_SECRET;
  if (!secret || req.headers.get("x-backup-secret") !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vizitka-backup-"));

  try {
    // VACUUM INTO снимает консистентный снимок БД, не блокируя текущие записи.
    const snapshotPath = path.join(tmpDir, "vizitka.db");
    backupDatabaseTo(snapshotPath);

    const archivePath = path.join(tmpDir, "archive.tar.gz");
    const args = ["czf", archivePath, "-C", tmpDir, "vizitka.db"];
    if (fs.existsSync(path.join(dataDir, "uploads"))) {
      args.push("-C", dataDir, "uploads");
    }
    execFileSync("tar", args);

    const buf = fs.readFileSync(archivePath);
    const filename = `vizitka-backup-${new Date().toISOString().slice(0, 10)}.tar.gz`;

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
