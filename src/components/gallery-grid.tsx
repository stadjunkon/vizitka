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
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по имени или роду занятий"
            className="h-11 rounded-full border-transparent bg-card pl-11 shadow-[0_8px_28px_rgba(0,0,0,0.06)] dark:border-white/10 dark:shadow-none"
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
        "rounded-full border px-3.5 py-1.5 text-[13px] transition-colors",
        active
          ? "border-foreground/60 bg-card text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
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
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:hover:border-white/25 dark:hover:shadow-none"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={profile.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-medium text-muted-foreground">
            {profile.name.charAt(0)}
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-card/90 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground backdrop-blur">
          {professionLabel(profile.profession)}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 p-3.5">
        <span className="truncate text-sm font-[550]">{profile.name}</span>
        <span className="truncate text-xs text-muted-foreground">{profile.role_title}</span>
      </div>
    </Link>
  );
}
