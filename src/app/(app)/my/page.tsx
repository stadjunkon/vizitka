"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, ExternalLink, X, Eye } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getMyVizitki, forgetVizitka, type MyVizitka } from "@/lib/my-vizitki";

export default function MyPage() {
  const [items, setItems] = useState<MyVizitka[] | null>(null);
  const [views, setViews] = useState<Record<string, number>>({});

  useEffect(() => {
    const list = getMyVizitki();
    setItems(list);
    // подтягиваем счётчики просмотров по каждой визитке
    list.forEach((v) => {
      fetch(`/api/views/${v.slug}`)
        .then((r) => r.json())
        .then((d) => setViews((prev) => ({ ...prev, [v.slug]: d.views ?? 0 })))
        .catch(() => {});
    });
  }, []);

  function handleForget(token: string) {
    forgetVizitka(token);
    setItems(getMyVizitki());
  }

  return (
    <div className="min-h-full bg-muted/20">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Мои визитки</h1>
          <p className="text-sm text-muted-foreground">
            Визитки, созданные в этом браузере. Список хранится только на этом устройстве.{" "}
            <Link href="/restore" className="underline underline-offset-2 hover:text-foreground">
              Потеряли ссылку для редактирования?
            </Link>
          </p>
        </div>

        {items === null ? null : items.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card py-16 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              Здесь пока пусто — вы ещё не создавали визиток на этом устройстве.
            </p>
            <Link href="/create" className={buttonVariants({ size: "sm" })}>
              Создать первую
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((v) => (
              <div
                key={v.editToken}
                className="flex items-center gap-3 rounded-xl border bg-card p-3"
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{v.name}</span>
                  <span className="truncate text-sm text-muted-foreground">{v.roleTitle}</span>
                  {views[v.slug] !== undefined && (
                    <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="size-3" />
                      {views[v.slug]}
                    </span>
                  )}
                </div>
                <Link
                  href={`/${v.slug}`}
                  target="_blank"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <ExternalLink className="size-3.5" />
                  <span className="hidden sm:inline">Открыть</span>
                </Link>
                <Link href={`/edit/${v.editToken}`} className={buttonVariants({ size: "sm" })}>
                  <Pencil className="size-3.5" />
                  <span className="hidden sm:inline">Изменить</span>
                </Link>
                <button
                  type="button"
                  onClick={() => handleForget(v.editToken)}
                  title="Убрать из списка (визитка не удаляется)"
                  className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
