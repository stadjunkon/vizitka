export interface ContactLink {
  label: string;
  href: string;
}

function digits(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function handle(value: string): string {
  return value.trim().replace(/^@/, "");
}

export function buildContacts(p: {
  phone: string;
  whatsapp: string;
  telegram: string;
  vk: string;
  instagram: string;
}): ContactLink[] {
  const links: ContactLink[] = [];

  if (p.whatsapp.trim()) {
    links.push({ label: "WhatsApp", href: `https://wa.me/${digits(p.whatsapp)}` });
  }
  if (p.telegram.trim()) {
    const t = handle(p.telegram);
    links.push({
      label: "Telegram",
      href: t.startsWith("http") ? t : `https://t.me/${t}`,
    });
  }
  if (p.phone.trim()) {
    links.push({ label: "Позвонить", href: `tel:+${digits(p.phone)}` });
  }
  if (p.instagram.trim()) {
    const h = handle(p.instagram);
    links.push({
      label: "Instagram",
      href: h.startsWith("http") ? h : `https://instagram.com/${h}`,
    });
  }
  if (p.vk.trim()) {
    const v = p.vk.trim();
    links.push({
      label: "VK",
      href: v.startsWith("http") ? v : `https://${v.replace(/^\/+/, "")}`,
    });
  }

  return links;
}
