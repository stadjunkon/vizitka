"use client";

// Локальный список визиток, созданных на этом устройстве.
// Без аккаунтов: браузер помнит, что вы создали, и даёт вернуться к правкам.

const KEY = "vizitka.my";

export interface MyVizitka {
  slug: string;
  editToken: string;
  name: string;
  roleTitle: string;
  savedAt: number;
}

export function getMyVizitki(): MyVizitka[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as MyVizitka[];
    return Array.isArray(list) ? list.sort((a, b) => b.savedAt - a.savedAt) : [];
  } catch {
    return [];
  }
}

export function rememberVizitka(v: Omit<MyVizitka, "savedAt">) {
  if (typeof window === "undefined") return;
  const list = getMyVizitki().filter((x) => x.editToken !== v.editToken);
  list.unshift({ ...v, savedAt: Date.now() });
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

export function forgetVizitka(editToken: string) {
  if (typeof window === "undefined") return;
  const list = getMyVizitki().filter((x) => x.editToken !== editToken);
  window.localStorage.setItem(KEY, JSON.stringify(list));
}
