"use client";

import { useEffect } from "react";

// Считает просмотр один раз за сессию браузера (перезагрузки не накручивают).
export function ViewBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `vizitka.viewed.${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* приватный режим — просто считаем */
    }
    fetch(`/api/views/${slug}`, { method: "POST" }).catch(() => {});
  }, [slug]);

  return null;
}
