import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

let _db: Database.Database | null = null;

function init(): Database.Database {
  const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });

  const database = new Database(path.join(dataDir, "vizitka.db"));
  database.pragma("journal_mode = WAL");
  database.exec(SCHEMA);
  return database;
}

/** Ленивый синглтон — БД открывается только при первом обращении (не на импорте/сборке). */
export const db = new Proxy({} as Database.Database, {
  get(_target, prop) {
    if (!_db) _db = init();
    const value = _db[prop as keyof Database.Database];
    return typeof value === "function" ? value.bind(_db) : value;
  },
});

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    edit_token TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    bio_raw TEXT NOT NULL DEFAULT '',
    bio_polished TEXT NOT NULL DEFAULT '',
    tagline TEXT NOT NULL DEFAULT '',
    avatar_url TEXT NOT NULL DEFAULT '',
    layout TEXT NOT NULL DEFAULT 'gallery',
    phone TEXT NOT NULL DEFAULT '',
    whatsapp TEXT NOT NULL DEFAULT '',
    telegram TEXT NOT NULL DEFAULT '',
    vk TEXT NOT NULL DEFAULT '',
    instagram TEXT NOT NULL DEFAULT '',
    published INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS works (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    after_image_url TEXT NOT NULL DEFAULT '',
    description_raw TEXT NOT NULL DEFAULT '',
    description_polished TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  );
`;

export type Layout = "gallery" | "cases" | "before_after";

export interface Work {
  id: string;
  profile_id: string;
  category: string;
  image_url: string;
  after_image_url: string;
  description_raw: string;
  description_polished: string;
  sort_order: number;
}

export interface Profile {
  id: string;
  edit_token: string;
  slug: string;
  name: string;
  role_title: string;
  bio_raw: string;
  bio_polished: string;
  tagline: string;
  avatar_url: string;
  layout: Layout;
  phone: string;
  whatsapp: string;
  telegram: string;
  vk: string;
  instagram: string;
  published: number;
  created_at: string;
  updated_at: string;
}

export function slugify(name: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  const transliterated = name
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("");
  return (
    transliterated
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "master"
  );
}

export function uniqueSlug(base: string): string {
  let slug = base;
  let n = 1;
  const exists = db.prepare("SELECT 1 FROM profiles WHERE slug = ?");
  while (exists.get(slug)) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export function getProfileBySlug(slug: string): Profile | undefined {
  return db.prepare("SELECT * FROM profiles WHERE slug = ? AND published = 1").get(slug) as
    | Profile
    | undefined;
}

export function getProfileByToken(token: string): Profile | undefined {
  return db.prepare("SELECT * FROM profiles WHERE edit_token = ?").get(token) as
    | Profile
    | undefined;
}

export function getWorksForProfile(profileId: string): Work[] {
  return db
    .prepare("SELECT * FROM works WHERE profile_id = ? ORDER BY sort_order ASC")
    .all(profileId) as Work[];
}
