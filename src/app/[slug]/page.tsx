import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getProfileBySlug, getWorksForProfile } from "@/lib/db";
import { buildContacts } from "@/lib/contacts";
import { Nav } from "@/components/nav";
import { ShareButton } from "@/components/share-button";
import { PublicWorks, type WorkView } from "@/components/public-works";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = getProfileBySlug(slug);
  if (!profile) return { title: "Не найдено" };
  return {
    title: `${profile.name} — ${profile.role_title}`,
    description: profile.tagline || profile.bio_polished || profile.bio_raw || undefined,
  };
}

export default async function PublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = getProfileBySlug(slug);
  if (!profile) notFound();

  const worksRaw = getWorksForProfile(profile.id).filter(
    (w) => w.image_url || w.description_polished,
  );
  const works: WorkView[] = worksRaw.map((w) => ({
    id: w.id,
    category: w.category,
    imageUrl: w.image_url,
    afterImageUrl: w.after_image_url,
    description: w.description_polished || w.description_raw,
  }));

  const contacts = buildContacts(profile);
  const bio = profile.bio_polished || profile.bio_raw;

  const h = await headers();
  const host = h.get("host") ?? "vizitka.me";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const pageUrl = `${proto}://${host}/${slug}`;

  return (
    <>
      <Nav />
      <div className="min-h-full bg-muted/30">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:py-14">
          {/* Шапка */}
          <header className="flex flex-col items-center gap-4 text-center">
            {profile.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="size-28 rounded-full object-cover ring-4 ring-background"
              />
            )}
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">{profile.name}</h1>
              <p className="text-muted-foreground">{profile.role_title}</p>
            </div>
            {profile.tagline && (
              <p className="max-w-md text-lg font-medium text-foreground/90">{profile.tagline}</p>
            )}
            {bio && <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{bio}</p>}

            {contacts.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2.5">
                {contacts.map((c) => {
                  const Icon = c.icon;
                  return (
                    <a
                      key={c.key}
                      href={c.href}
                      target={c.external ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      title={c.label}
                      aria-label={c.label}
                      className="flex size-11 items-center justify-center rounded-full text-white transition-transform hover:scale-105"
                      style={{ backgroundColor: c.brand }}
                    >
                      <Icon className="size-5" />
                    </a>
                  );
                })}
              </div>
            )}

            <ShareButton url={pageUrl} name={`${profile.name} — ${profile.role_title}`} />
          </header>

          {works.length > 0 && <PublicWorks works={works} layout={profile.layout} />}

          <footer className="pt-4 text-center text-xs text-muted-foreground">
            <a href="/" className="hover:underline">
              Сделано на vizitka.me
            </a>
          </footer>
        </div>
      </div>
    </>
  );
}
