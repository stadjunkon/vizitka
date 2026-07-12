import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db, slugify, uniqueSlug } from "@/lib/db";
import type { ProfilePayload } from "@/lib/types";

export async function POST(req: NextRequest) {
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
      avatar_url, layout, profession, listed, phone, whatsapp, telegram, vk, instagram, published
    ) VALUES (@id, @edit_token, @slug, @name, @role_title, @bio_raw, @bio_polished, @tagline,
      @avatar_url, @layout, @profession, @listed, @phone, @whatsapp, @telegram, @vk, @instagram, 1)
  `);

  const insertWork = db.prepare(`
    INSERT INTO works (id, profile_id, category, image_url, after_image_url, description_raw, description_polished, sort_order)
    VALUES (@id, @profile_id, @category, @image_url, @after_image_url, @description_raw, @description_polished, @sort_order)
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
      vk: body.vk ?? "",
      instagram: body.instagram ?? "",
    });

    body.works.forEach((w, i) => {
      insertWork.run({
        id: randomUUID(),
        profile_id: id,
        category: w.category ?? "",
        image_url: w.imageUrl ?? "",
        after_image_url: w.afterImageUrl ?? "",
        description_raw: w.descriptionRaw ?? "",
        description_polished: w.descriptionPolished ?? "",
        sort_order: i,
      });
    });
  });
  tx();

  return NextResponse.json({ slug, editToken });
}
