import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { GalleryGrid } from "@/components/gallery-grid";
import { getListedProfiles } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function Home() {
  const profiles = getListedProfiles();

  return (
    <div className="min-h-full bg-muted/20">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 sm:py-16">
        <section className="flex flex-col items-center gap-5 text-center">
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Портфолио мастеров, собранное за 5 минут
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Вместо разрозненных фото в WhatsApp и хайлайтах — одна аккуратная страница.
            Вводите тезисы, ИИ помогает оформить, а финал всегда за вами.
          </p>
          <Link
            href="/create"
            className={buttonVariants({ size: "lg", className: "h-12 px-8 text-base" })}
          >
            Создать свою визитку
          </Link>
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Примеры визиток</h2>
            {profiles.length > 0 && (
              <span className="text-sm text-muted-foreground">{profiles.length} в галерее</span>
            )}
          </div>

          {profiles.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Пока пусто. Будьте первым —{" "}
                <Link href="/create" className="font-medium text-primary hover:underline">
                  создайте визитку
                </Link>
                .
              </p>
            </div>
          ) : (
            <GalleryGrid profiles={profiles} />
          )}
        </section>
      </main>
    </div>
  );
}
