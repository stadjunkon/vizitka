import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db, slugify, uniqueSlug } from "@/lib/db";
import { rateLimitOrResponse } from "@/lib/rate-limit";
import type { ProfilePayload } from "@/lib/types";

export async function POST(req: NextRequest) {
  const limited = rateLimitOrResponse(req, "profiles:create", 5, 60 * 60 * 1000);
  if (limited) return limited;

  const body = (await req.json()) as ProfilePayload;

  if (!body.name?.trim() || !body.roleTitle?.trim()) {
    return NextResponse.json({ error: "Имя и род занятий обязательны" }, { status: 400 });
  }

  const id = randomUUID();
  const editToken = randomUUID();
  const slug = uniqueSlug(slugify(body.name));

  const insertProfile = db.prepare(`
    INSERT INTO profiles (
      id, edit_token, slug, name, role_title, bio_raw, bio_polished, tagline,
      avatar_url, layout, profession, listed,
      phone, whatsapp, telegram, viber, vk, odnoklassniki, instagram, tiktok, youtube, facebook, email, website,
      recovery_email,
      published
    ) VALUES (@id, @edit_token, @slug, @name, @role_title, @bio_raw, @bio_polished, @tagline,
      @avatar_url, @layout, @profession, @listed,
      @phone, @whatsapp, @telegram, @viber, @vk, @odnoklassniki, @instagram, @tiktok, @youtube, @facebook, @email, @website,
      @recovery_email,
      1)
  `);

  const insertWork = db.prepare(`
    INSERT INTO works (id, profile_id, category, image_url, after_image_url, images, description_raw, description_polished, sort_order)
    VALUES (@id, @profile_id, @category, @image_url, @after_image_url, @images, @description_raw, @description_polished, @sort_order)
  `);

  const tx = db.transaction(() => {
    insertProfile.run({
      id,
      edit_token: editToken,
      slug,
      name: body.name,
      role_title: body.roleTitle,
      bio_raw: body.bioRaw ?? "",
      bio_polished: body.bioPolished ?? "",
      tagline: body.tagline ?? "",
      avatar_url: body.avatarUrl ?? "",
      layout: body.layout ?? "gallery",
      profession: body.profession ?? "other",
      listed: body.listed === false ? 0 : 1,
      phone: body.phone ?? "",
      whatsapp: body.whatsapp ?? "",
      telegram: body.telegram ?? "",
      viber: body.viber ?? "",
      vk: body.vk ?? "",
      odnoklassniki: body.odnoklassniki ?? "",
      instagram: body.instagram ?? "",
      tiktok: body.tiktok ?? "",
      youtube: body.youtube ?? "",
      facebook: body.facebook ?? "",
      email: body.email ?? "",
      website: body.website ?? "",
      recovery_email: body.recoveryEmail ?? "",
    });

    body.works.forEach((w, i) => {
      const images = Array.isArray(w.images) ? w.images.filter(Boolean) : [];
      insertWork.run({
        id: randomUUID(),
        profile_id: id,
        category: w.category ?? "",
        image_url: w.imageUrl || images[0] || "",
        after_image_url: w.afterImageUrl ?? "",
        images: JSON.stringify(images),
        description_raw: w.descriptionRaw ?? "",
        description_polished: w.descriptionPolished ?? "",
        sort_order: i,
      });
    });
  });
  tx();

  return NextResponse.json({ slug, editToken });
}
