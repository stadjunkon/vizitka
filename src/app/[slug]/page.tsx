import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfileBySlug, getWorksForProfile, type Profile, type Work } from "@/lib/db";
import { buildContacts } from "@/lib/contacts";

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

  const works = getWorksForProfile(profile.id).filter((w) => w.image_url || w.description_polished);
  const contacts = buildContacts(profile);
  const bio = profile.bio_polished || profile.bio_raw;

  return (
    <div className="min-h-full bg-muted/30">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:py-16">
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
            <div className="flex flex-wrap justify-center gap-2">
              {contacts.map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  {c.label}
                </a>
              ))}
            </div>
          )}
        </header>

        {works.length > 0 && <WorksSection layout={profile.layout} works={works} />}

        <footer className="pt-4 text-center text-xs text-muted-foreground">
          <a href="/" className="hover:underline">
            Сделано на vizitka.me
          </a>
        </footer>
      </div>
    </div>
  );
}

function WorksSection({ layout, works }: { layout: Profile["layout"]; works: Work[] }) {
  if (layout === "gallery") return <GalleryLayout works={works} />;
  if (layout === "before_after") return <BeforeAfterLayout works={works} />;
  return <CasesLayout works={works} />;
}

function GalleryLayout({ works }: { works: Work[] }) {
  return (
    <section className="grid grid-cols-2 gap-3">
      {works.map((w) => (
        <figure key={w.id} className="flex flex-col gap-2">
          {w.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={w.image_url}
              alt={w.category}
              className="aspect-square w-full rounded-xl object-cover"
            />
          )}
          {(w.category || w.description_polished) && (
            <figcaption className="flex flex-col gap-0.5">
              {w.category && <span className="text-sm font-medium">{w.category}</span>}
              {w.description_polished && (
                <span className="text-xs text-muted-foreground">{w.description_polished}</span>
              )}
            </figcaption>
          )}
        </figure>
      ))}
    </section>
  );
}

function CasesLayout({ works }: { works: Work[] }) {
  return (
    <section className="flex flex-col gap-6">
      {works.map((w) => (
        <article
          key={w.id}
          className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row"
        >
          {w.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={w.image_url}
              alt={w.category}
              className="aspect-video w-full shrink-0 rounded-lg object-cover sm:w-40"
            />
          )}
          <div className="flex flex-col gap-1.5">
            {w.category && <h3 className="font-medium">{w.category}</h3>}
            {w.description_polished && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {w.description_polished}
              </p>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

function BeforeAfterLayout({ works }: { works: Work[] }) {
  return (
    <section className="flex flex-col gap-6">
      {works.map((w) => (
        <article key={w.id} className="flex flex-col gap-2">
          {w.category && <h3 className="font-medium">{w.category}</h3>}
          <div className="grid grid-cols-2 gap-2">
            <BeforeAfterImage src={w.image_url} label="До" />
            <BeforeAfterImage src={w.after_image_url} label="После" />
          </div>
          {w.description_polished && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {w.description_polished}
            </p>
          )}
        </article>
      ))}
    </section>
  );
}

function BeforeAfterImage({ src, label }: { src: string; label: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="aspect-square w-full object-cover" />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center bg-muted text-xs text-muted-foreground">
          нет фото
        </div>
      )}
      <span className="absolute left-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-xs font-medium">
        {label}
      </span>
    </div>
  );
}
