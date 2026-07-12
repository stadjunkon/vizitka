"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PROFESSIONS, professionLabel, type Profession } from "@/lib/professions";
import type { GalleryProfile } from "@/lib/db";

export function GalleryGrid({ profiles }: { profiles: GalleryProfile[] }) {
  const [query, setQuery] = useState("");
  const [profession, setProfession] = useState<Profession | "all">("all");

  // Показываем в фильтре только те сферы, что реально есть в галерее.
  const availableProfessions = useMemo(() => {
    const present = new Set(profiles.map((p) => p.profession));
    return PROFESSIONS.filter((p) => present.has(p.value));
  }, [profiles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((p) => {
      if (profession !== "all" && p.profession !== profession) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.role_title.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q)
      );
    });
  }, [profiles, query, profession]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по имени или роду занятий"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterChip active={profession === "all"} onClick={() => setProfession("all")}>
            Все
          </FilterChip>
          {availableProfessions.map((p) => (
            <FilterChip
              key={p.value}
              active={profession === p.value}
              onClick={() => setProfession(p.value)}
            >
              {p.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Ничего не нашлось. Попробуйте другой запрос.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((p) => (
            <GalleryCard key={p.slug} profile={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
          : "border-input text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function GalleryCard({ profile }: { profile: GalleryProfile }) {
  const image = profile.thumb || profile.avatar_url;
  return (
    <Link
      href={`/${profile.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={profile.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted-foreground">
            {profile.name.charAt(0)}
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
          {professionLabel(profile.profession)}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 p-3">
        <span className="truncate text-sm font-semibold">{profile.name}</span>
        <span className="truncate text-xs text-muted-foreground">{profile.role_title}</span>
      </div>
    </Link>
  );
}
