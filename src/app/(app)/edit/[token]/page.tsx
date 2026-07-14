import { notFound } from "next/navigation";
import { getProfileByToken, getWorksForProfile, workImages, type Layout } from "@/lib/db";
import { PortfolioForm, type PortfolioFormInitial } from "@/components/portfolio-form";

export default async function EditPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const profile = getProfileByToken(token);
  if (!profile) notFound();

  const works = getWorksForProfile(profile.id);

  const initial: PortfolioFormInitial = {
    name: profile.name,
    roleTitle: profile.role_title,
    bioRaw: profile.bio_raw,
    bioPolished: profile.bio_polished,
    tagline: profile.tagline,
    avatarUrl: profile.avatar_url,
    layout: profile.layout as Layout,
    profession: profile.profession,
    listed: profile.listed === 1,
    phone: profile.phone,
    whatsapp: profile.whatsapp,
    telegram: profile.telegram,
    viber: profile.viber,
    vk: profile.vk,
    odnoklassniki: profile.odnoklassniki,
    instagram: profile.instagram,
    tiktok: profile.tiktok,
    youtube: profile.youtube,
    facebook: profile.facebook,
    email: profile.email,
    website: profile.website,
    recoveryEmail: profile.recovery_email,
    works:
      works.length > 0
        ? works.map((w) => ({
            category: w.category,
            imageUrl: w.image_url,
            afterImageUrl: w.after_image_url,
            images: workImages(w),
            descriptionRaw: w.description_raw,
            descriptionPolished: w.description_polished,
          }))
        : [
            {
              category: "",
              imageUrl: "",
              afterImageUrl: "",
              images: [],
              descriptionRaw: "",
              descriptionPolished: "",
            },
          ],
  };

  return (
    <PortfolioForm
      mode="edit"
      token={token}
      initial={initial}
      initialSlug={profile.slug}
      views={profile.views}
    />
  );
}
