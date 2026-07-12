import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { getProfileBySlug } from "@/lib/db";
import { professionLabel } from "@/lib/professions";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");

function readFont(file: string): Buffer {
  return fs.readFileSync(path.join(process.cwd(), "node_modules/@fontsource/inter/files", file));
}

// Satori (next/og) не умеет webp — конвертируем аватар в PNG через sharp.
async function avatarDataUri(avatarUrl: string): Promise<string | null> {
  try {
    if (!avatarUrl.startsWith("/api/uploads/")) return null;
    const filename = avatarUrl.replace("/api/uploads/", "");
    if (filename.includes("/") || filename.includes("..")) return null;
    const buf = fs.readFileSync(path.join(dataDir, "uploads", filename));
    const png = await sharp(buf).resize(240, 240, { fit: "cover" }).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = getProfileBySlug(slug);

  const name = profile?.name ?? "vizitka.me";
  const role = profile?.role_title ?? "Портфолио за 5 минут";
  const tagline = profile?.tagline ?? "";
  const avatar = profile ? await avatarDataUri(profile.avatar_url) : null;
  const profession = profile ? professionLabel(profile.profession) : "";

  const fontRegular = readFont("inter-cyrillic-400-normal.woff");
  const fontBold = readFont("inter-cyrillic-700-normal.woff");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FBFAF8",
          padding: "72px",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "48px" }}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              width={240}
              height={240}
              style={{ width: 240, height: 240, borderRadius: 240, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 240,
                height: 240,
                borderRadius: 240,
                background: "#EFE7EC",
                color: "#C42B6B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 120,
                fontWeight: 700,
              }}
            >
              {name.charAt(0)}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}>
            {profession && (
              <div
                style={{
                  display: "flex",
                  alignSelf: "flex-start",
                  background: "#F3E1EA",
                  color: "#C42B6B",
                  padding: "8px 20px",
                  borderRadius: 999,
                  fontSize: 26,
                  fontWeight: 600,
                  marginBottom: 20,
                }}
              >
                {profession}
              </div>
            )}
            <div style={{ fontSize: 72, fontWeight: 700, color: "#1C1A1E", lineHeight: 1.05 }}>
              {name}
            </div>
            <div style={{ fontSize: 38, color: "#6B6570", marginTop: 8 }}>{role}</div>
            {tagline && (
              <div style={{ fontSize: 30, color: "#8A8590", marginTop: 20, lineHeight: 1.3 }}>
                {tagline.length > 90 ? tagline.slice(0, 90) + "…" : tagline}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#1C1A1E" }}>
            vizitka<span style={{ color: "#C42B6B" }}>.me</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: fontRegular, weight: 400, style: "normal" },
        { name: "Inter", data: fontBold, weight: 700, style: "normal" },
      ],
    },
  );
}
