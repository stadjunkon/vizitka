import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db, getProfileByToken, getWorksForProfile, deleteProfileByToken } from "@/lib/db";
import type { ProfilePayload } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const profile = getProfileByToken(token);
  if (!profile) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
  const works = getWorksForProfile(profile.id);
  return NextResponse.json({ profile, works });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const profile = getProfileByToken(token);
  if (!profile) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const body = (await req.json()) as ProfilePayload;
  if (!body.name?.trim() || !body.roleTitle?.trim()) {
    return NextResponse.json({ error: "Имя и род занятий обязательны" }, { status: 400 });
  }

  const updateProfile = db.prepare(`
    UPDATE profiles SET
      name = @name, role_title = @role_title, bio_raw = @bio_raw, bio_polished = @bio_polished,
      tagline = @tagline, avatar_url = @avatar_url, layout = @layout, profession = @profession,
      listed = @listed, phone = @phone, whatsapp = @whatsapp, telegram = @telegram,
      viber = @viber, vk = @vk, odnoklassniki = @odnoklassniki, instagram = @instagram,
      tiktok = @tiktok, youtube = @youtube, facebook = @facebook, email = @email, website = @website,
      updated_at = datetime('now')
    WHERE id = @id
  `);

  const insertWork = db.prepare(`
    INSERT INTO works (id, profile_id, category, image_url, after_image_url, description_raw, description_polished, sort_order)
    VALUES (@id, @profile_id, @category, @image_url, @after_image_url, @description_raw, @description_polished, @sort_order)
  `);
  const deleteWorks = db.prepare("DELETE FROM works WHERE profile_id = ?");

  const tx = db.transaction(() => {
    updateProfile.run({
      id: profile.id,
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
    });

    deleteWorks.run(profile.id);
    body.works.forEach((w, i) => {
      insertWork.run({
        id: randomUUID(),
        profile_id: profile.id,
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

  return NextResponse.json({ slug: profile.slug });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const ok = deleteProfileByToken(token);
  if (!ok) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
  return NextResponse.json({ deleted: true });
}
