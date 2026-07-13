import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { GalleryGrid } from "@/components/gallery-grid";
import { getListedProfiles } from "@/lib/db";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function Home() {
  const profiles = getListedProfiles();

  return (
    <div className="relative min-h-full overflow-hidden">
      <div aria-hidden className="ghost-mark top-24 sm:top-16">
        VIZITKA
      </div>

      <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-14 px-4 pb-20 pt-20 sm:pt-28">
        <section className="flex flex-col items-center gap-6 text-center">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground">
            ✳ ПОРТФОЛИО ЗА 5 МИНУТ
          </p>
          <h1 className="max-w-xl text-[27px] font-medium leading-snug tracking-[-0.015em] sm:text-[32px]">
            <span className="text-azure">Vizitka®</span> помогает мастерам показывать работы —
            просто и красиво
          </h1>
          <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Фото, пара строк, контакты — страница собирается за пять минут.
            Остальное — воздух.
          </p>
          <Link
            href="/create"
            className={cn(buttonVariants({ size: "lg" }), "h-11 px-7 text-[15px]")}
          >
            Создать визитку
          </Link>
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-[550] tracking-[0.01em] text-foreground">
              Примеры визиток
            </h2>
            {profiles.length > 0 && (
              <span className="text-xs tabular-nums text-muted-foreground">
                {profiles.length} в галерее
              </span>
            )}
          </div>

          {profiles.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Пока пусто. Будьте первым —{" "}
                <Link href="/create" className="font-medium text-azure hover:underline">
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
