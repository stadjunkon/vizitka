import type { ComponentType } from "react";
import {
  SiWhatsapp,
  SiTelegram,
  SiViber,
  SiVk,
  SiOdnoklassniki,
  SiInstagram,
  SiTiktok,
  SiYoutube,
  SiFacebook,
} from "react-icons/si";
import { Phone, Mail, Globe } from "lucide-react";

export type ContactKey =
  | "whatsapp"
  | "telegram"
  | "phone"
  | "viber"
  | "instagram"
  | "vk"
  | "odnoklassniki"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "email"
  | "website";

type IconComponent = ComponentType<{ className?: string; size?: number }>;

export interface ContactType {
  key: ContactKey;
  label: string;
  placeholder: string;
  icon: IconComponent;
  brand: string;
  build: (v: string) => string;
}

export interface BuiltContact {
  key: ContactKey;
  label: string;
  href: string;
  icon: IconComponent;
  brand: string;
  external: boolean;
}

function digits(v: string): string {
  return v.replace(/[^\d]/g, "");
}
function handle(v: string): string {
  return v.trim().replace(/^@/, "").replace(/\/+$/, "");
}
/** Если ввели полную ссылку — используем как есть, иначе строим из ника. */
function urlOr(base: string, v: string): string {
  const t = v.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return base + handle(t);
}

// Порядок — по релевантности для СНГ.
export const CONTACT_TYPES: ContactType[] = [
  { key: "whatsapp", label: "WhatsApp", placeholder: "+7 700 000 00 00", icon: SiWhatsapp, brand: "#25D366", build: (v) => `https://wa.me/${digits(v)}` },
  { key: "telegram", label: "Telegram", placeholder: "@username", icon: SiTelegram, brand: "#26A5E4", build: (v) => urlOr("https://t.me/", v) },
  { key: "phone", label: "Телефон", placeholder: "+7 700 000 00 00", icon: Phone, brand: "#0F766E", build: (v) => `tel:+${digits(v)}` },
  { key: "viber", label: "Viber", placeholder: "+7 700 000 00 00", icon: SiViber, brand: "#7360F2", build: (v) => `viber://chat?number=${digits(v)}` },
  { key: "instagram", label: "Instagram", placeholder: "@username", icon: SiInstagram, brand: "#E4405F", build: (v) => urlOr("https://instagram.com/", v) },
  { key: "vk", label: "ВКонтакте", placeholder: "vk.com/username", icon: SiVk, brand: "#0077FF", build: (v) => urlOr("https://vk.com/", v) },
  { key: "odnoklassniki", label: "Одноклассники", placeholder: "ok.ru/username", icon: SiOdnoklassniki, brand: "#EE8208", build: (v) => urlOr("https://ok.ru/", v) },
  { key: "tiktok", label: "TikTok", placeholder: "@username", icon: SiTiktok, brand: "#000000", build: (v) => urlOr("https://tiktok.com/@", v) },
  { key: "youtube", label: "YouTube", placeholder: "@channel или ссылка", icon: SiYoutube, brand: "#FF0000", build: (v) => urlOr("https://youtube.com/@", v) },
  { key: "facebook", label: "Facebook", placeholder: "username или ссылка", icon: SiFacebook, brand: "#0866FF", build: (v) => urlOr("https://facebook.com/", v) },
  { key: "email", label: "Email", placeholder: "you@mail.com", icon: Mail, brand: "#334155", build: (v) => `mailto:${v.trim()}` },
  { key: "website", label: "Сайт", placeholder: "example.com", icon: Globe, brand: "#334155", build: (v) => urlOr("https://", v) },
];

export function buildContacts(p: Partial<Record<ContactKey, string>>): BuiltContact[] {
  return CONTACT_TYPES.filter((c) => (p[c.key] ?? "").trim()).map((c) => {
    const href = c.build((p[c.key] ?? "").trim());
    return {
      key: c.key,
      label: c.label,
      href,
      icon: c.icon,
      brand: c.brand,
      external: /^https?:\/\//i.test(href),
    };
  });
}
