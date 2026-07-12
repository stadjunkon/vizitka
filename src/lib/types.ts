export interface WorkPayload {
  id?: string;
  category: string;
  imageUrl: string;
  afterImageUrl: string;
  images: string[];
  descriptionRaw: string;
  descriptionPolished: string;
}

export interface ProfilePayload {
  name: string;
  roleTitle: string;
  bioRaw: string;
  bioPolished: string;
  tagline: string;
  avatarUrl: string;
  layout: "gallery" | "cases" | "before_after";
  profession: "beauty" | "photo" | "tutor" | "repair" | "other";
  listed: boolean;
  phone: string;
  whatsapp: string;
  telegram: string;
  viber: string;
  vk: string;
  odnoklassniki: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  facebook: string;
  email: string;
  website: string;
  works: WorkPayload[];
}
