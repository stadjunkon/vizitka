import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getProfileBySlug, getWorksForProfile, workImages } from "@/lib/db";
import { buildContacts } from "@/lib/contacts";
import { Nav } from "@/components/nav";
import { ShareButton } from "@/components/share-button";
import { ViewBeacon } from "@/components/view-beacon";
import { PublicWorks, type WorkView } from "@/components/public-works";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = getProfileBySlug(slug);
  if (!profile) return { title: "Не найдено" };

  const h = await headers();
  const host = h.get("host") ?? "vizitka.me";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const title = `${profile.name} — ${profile.role_title}`;
  const description = profile.tagline || profile.bio_polished || profile.bio_raw || undefined;

  return {
    metadataBase: new URL(`${proto}://${host}`),
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/${slug}`,
      siteName: "vizitka.me",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
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
    images: workImages(w),
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
      <ViewBeacon slug={slug} />
      <div className="min-h-full">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-9 px-4 py-10 sm:py-14">
          {/* Шапка */}
          <header className="flex flex-col items-center gap-4 text-center">
            {profile.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="size-28 rounded-full object-cover shadow-[0_16px_44px_rgba(0,0,0,0.10)]"
              />
            )}
            <div className="flex flex-col gap-1">
              <h1 className="text-[23px] font-[550] tracking-[-0.01em]">{profile.name}</h1>
              <p className="text-sm text-muted-foreground">{profile.role_title}</p>
            </div>
            {profile.tagline && (
              <p className="max-w-md text-[17px] font-medium leading-snug tracking-[-0.01em] text-foreground/90">
                {profile.tagline}
              </p>
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
                      className="flex size-11 items-center justify-center rounded-full border border-border/70 bg-card text-(--brand) shadow-[0_6px_20px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] dark:text-(--brand-dark) dark:shadow-none dark:hover:bg-muted"
                      style={
                        {
                          "--brand": c.brand,
                          "--brand-dark": c.brandDark,
                        } as React.CSSProperties
                      }
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

          <footer className="pt-6 text-center">
            <a
              href="/"
              className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
            >
              СДЕЛАНО НА VIZITKA<sup className="text-[8px]">®</sup>
            </a>
          </footer>
        </div>
      </div>
    </>
  );
}
