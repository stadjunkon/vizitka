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
  const fontMedium = readFont("inter-cyrillic-600-normal.woff");
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
          background: "#FAFAFA",
          padding: "72px",
          fontFamily: "Inter",
          position: "relative",
        }}
      >
        {/* призрачный водяной знак */}
        <div
          style={{
            position: "absolute",
            bottom: -42,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            fontSize: 230,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: "#EFEFEE",
          }}
        >
          VIZITKA
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "48px" }}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              width={230}
              height={230}
              style={{ width: 230, height: 230, borderRadius: 230, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 230,
                height: 230,
                borderRadius: 230,
                background: "#EFEFEE",
                color: "#868A8F",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 110,
                fontWeight: 600,
              }}
            >
              {name.charAt(0)}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", maxWidth: 740 }}>
            {profession && (
              <div
                style={{
                  display: "flex",
                  alignSelf: "flex-start",
                  background: "#FFFFFF",
                  color: "#868A8F",
                  padding: "9px 22px",
                  borderRadius: 999,
                  fontSize: 24,
                  fontWeight: 600,
                  marginBottom: 22,
                  boxShadow: "0 6px 24px rgba(0,0,0,0.07)",
                }}
              >
                {profession}
              </div>
            )}
            <div style={{ fontSize: 68, fontWeight: 600, color: "#171717", lineHeight: 1.06, letterSpacing: "-0.02em" }}>
              {name}
            </div>
            <div style={{ fontSize: 34, color: "#868A8F", marginTop: 10 }}>{role}</div>
            {tagline && (
              <div style={{ fontSize: 28, color: "#3A3D42", marginTop: 22, lineHeight: 1.32 }}>
                {tagline.length > 90 ? tagline.slice(0, 90) + "…" : tagline}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 44, color: "#C9CDD1", fontWeight: 700 }}>*</div>
          <div style={{ display: "flex", alignItems: "flex-start", fontSize: 27, fontWeight: 700, letterSpacing: "0.01em", color: "#171717" }}>
            VIZITKA<span style={{ fontSize: 15, color: "#868A8F", marginTop: 1, marginLeft: 2 }}>®</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: fontRegular, weight: 400, style: "normal" },
        { name: "Inter", data: fontMedium, weight: 600, style: "normal" },
        { name: "Inter", data: fontBold, weight: 700, style: "normal" },
      ],
    },
  );
}
