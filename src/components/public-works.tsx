"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorkView {
  id: string;
  category: string;
  imageUrl: string;
  afterImageUrl: string;
  description: string;
}

type Layout = "gallery" | "cases" | "before_after";

export function PublicWorks({ works, layout }: { works: WorkView[]; layout: Layout }) {
  const categories = useMemo(() => {
    const list: string[] = [];
    for (const w of works) if (w.category && !list.includes(w.category)) list.push(w.category);
    return list;
  }, [works]);

  const [active, setActive] = useState<string>("all");
  const filtered = active === "all" ? works : works.filter((w) => w.category === active);

  // Плоский список фото для просмотра (lightbox) — в порядке отображения.
  const images = useMemo(() => {
    const arr: string[] = [];
    for (const w of filtered) {
      if (w.imageUrl) arr.push(w.imageUrl);
      if (layout === "before_after" && w.afterImageUrl) arr.push(w.afterImageUrl);
    }
    return arr;
  }, [filtered, layout]);

  const [lightbox, setLightbox] = useState<number | null>(null);
  const open = useCallback((src: string) => {
    setLightbox(images.indexOf(src));
  }, [images]);

  return (
    <section className="flex flex-col gap-5">
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <CatChip active={active === "all"} onClick={() => setActive("all")}>
            Все работы
          </CatChip>
          {categories.map((c) => (
            <CatChip key={c} active={active === c} onClick={() => setActive(c)}>
              {c}
            </CatChip>
          ))}
        </div>
      )}

      {layout === "gallery" && <Gallery works={filtered} onOpen={open} />}
      {layout === "cases" && <Cases works={filtered} onOpen={open} />}
      {layout === "before_after" && <BeforeAfter works={filtered} onOpen={open} />}

      {lightbox !== null && images[lightbox] && (
        <Lightbox
          images={images}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndex={setLightbox}
        />
      )}
    </section>
  );
}

function CatChip({
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
        "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
          : "border-input text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function Thumb({ src, alt, onOpen, className }: { src: string; alt: string; onOpen: (s: string) => void; className?: string }) {
  return (
    <button type="button" onClick={() => onOpen(src)} className={cn("group block overflow-hidden", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full cursor-zoom-in object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
    </button>
  );
}

function Gallery({ works, onOpen }: { works: WorkView[]; onOpen: (s: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {works.map((w) => (
        <figure key={w.id} className="flex flex-col gap-2">
          {w.imageUrl && <Thumb src={w.imageUrl} alt={w.category} onOpen={onOpen} className="aspect-square w-full rounded-xl" />}
          {(w.category || w.description) && (
            <figcaption className="flex flex-col gap-0.5">
              {w.category && <span className="text-sm font-medium">{w.category}</span>}
              {w.description && <span className="text-xs text-muted-foreground">{w.description}</span>}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

function Cases({ works, onOpen }: { works: WorkView[]; onOpen: (s: string) => void }) {
  return (
    <div className="flex flex-col gap-4">
      {works.map((w) => (
        <article key={w.id} className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row">
          {w.imageUrl && (
            <Thumb src={w.imageUrl} alt={w.category} onOpen={onOpen} className="aspect-video w-full shrink-0 rounded-lg sm:w-40" />
          )}
          <div className="flex flex-col gap-1.5">
            {w.category && <h3 className="font-medium">{w.category}</h3>}
            {w.description && <p className="text-sm leading-relaxed text-muted-foreground">{w.description}</p>}
          </div>
        </article>
      ))}
    </div>
  );
}

function BeforeAfter({ works, onOpen }: { works: WorkView[]; onOpen: (s: string) => void }) {
  return (
    <div className="flex flex-col gap-6">
      {works.map((w) => (
        <article key={w.id} className="flex flex-col gap-2">
          {w.category && <h3 className="font-medium">{w.category}</h3>}
          <div className="grid grid-cols-2 gap-2">
            <BAImage src={w.imageUrl} label="До" onOpen={onOpen} />
            <BAImage src={w.afterImageUrl} label="После" onOpen={onOpen} />
          </div>
          {w.description && <p className="text-sm leading-relaxed text-muted-foreground">{w.description}</p>}
        </article>
      ))}
    </div>
  );
}

function BAImage({ src, label, onOpen }: { src: string; label: string; onOpen: (s: string) => void }) {
  return (
    <div className="relative overflow-hidden rounded-xl">
      {src ? (
        <Thumb src={src} alt={label} onOpen={onOpen} className="aspect-square w-full" />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center bg-muted text-xs text-muted-foreground">
          нет фото
        </div>
      )}
      <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-xs font-medium">
        {label}
      </span>
    </div>
  );
}

function Lightbox({
  images,
  index,
  onClose,
  onIndex,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const prev = useCallback(() => onIndex((index - 1 + images.length) % images.length), [index, images.length, onIndex]);
  const next = useCallback(() => onIndex((index + 1) % images.length), [index, images.length, onIndex]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        aria-label="Закрыть"
      >
        <X className="size-5" />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-3 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Предыдущее"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-3 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Следующее"
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] max-w-full rounded-lg object-contain"
      />

      {images.length > 1 && (
        <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
          {index + 1} / {images.length}
        </span>
      )}
    </div>
  );
}
