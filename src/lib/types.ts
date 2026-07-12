export interface WorkPayload {
  id?: string;
  category: string;
  imageUrl: string;
  afterImageUrl: string;
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
  phone: string;
  whatsapp: string;
  telegram: string;
  vk: string;
  instagram: string;
  works: WorkPayload[];
}
