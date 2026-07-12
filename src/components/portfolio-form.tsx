"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  Check,
  Copy,
  ExternalLink,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/image-upload";
import { cn } from "@/lib/utils";
import type { ProfilePayload } from "@/lib/types";

type Layout = ProfilePayload["layout"];

interface FormWork {
  category: string;
  imageUrl: string;
  afterImageUrl: string;
  descriptionRaw: string;
  descriptionPolished: string;
}

export interface PortfolioFormInitial extends Omit<ProfilePayload, "works"> {
  works: FormWork[];
}

interface PortfolioFormProps {
  mode: "create" | "edit";
  token?: string;
  initial?: PortfolioFormInitial;
  initialSlug?: string;
}

const LAYOUTS: { value: Layout; title: string; desc: string }[] = [
  { value: "gallery", title: "Галерея фото", desc: "Фотографы, бьюти-мастера" },
  { value: "cases", title: "Кейсы с текстом", desc: "Репетиторы, консультанты" },
  { value: "before_after", title: "До / После", desc: "Ремонт, бьюти" },
];

function emptyWork(): FormWork {
  return {
    category: "",
    imageUrl: "",
    afterImageUrl: "",
    descriptionRaw: "",
    descriptionPolished: "",
  };
}

function blankState(): PortfolioFormInitial {
  return {
    name: "",
    roleTitle: "",
    bioRaw: "",
    bioPolished: "",
    tagline: "",
    avatarUrl: "",
    layout: "gallery",
    phone: "",
    whatsapp: "",
    telegram: "",
    vk: "",
    instagram: "",
    works: [emptyWork()],
  };
}

export function PortfolioForm({ mode, token, initial, initialSlug }: PortfolioFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<PortfolioFormInitial>(initial ?? blankState());
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ slug: string; editToken: string } | null>(null);

  function update<K extends keyof PortfolioFormInitial>(key: K, value: PortfolioFormInitial[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateWork(index: number, patch: Partial<FormWork>) {
    setForm((prev) => ({
      ...prev,
      works: prev.works.map((w, i) => (i === index ? { ...w, ...patch } : w)),
    }));
  }

  function addWork() {
    setForm((prev) => ({ ...prev, works: [...prev.works, emptyWork()] }));
  }

  function removeWork(index: number) {
    setForm((prev) => ({ ...prev, works: prev.works.filter((_, i) => i !== index) }));
  }

  async function handleGenerate() {
    if (!form.name.trim() || !form.roleTitle.trim()) {
      toast.error("Сначала заполните имя и род занятий");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          roleTitle: form.roleTitle,
          bioRaw: form.bioRaw,
          works: form.works.map((w) => ({
            category: w.category,
            descriptionRaw: w.descriptionRaw,
          })),
        }),
      });
      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        tagline: data.tagline || prev.tagline,
        bioPolished: data.bioPolished ?? prev.bioRaw,
        works: prev.works.map((w, i) => ({
          ...w,
          // не перезатираем категорию, введённую вручную
          category: w.category || data.works?.[i]?.category || "",
          descriptionPolished: data.works?.[i]?.descriptionPolished ?? w.descriptionRaw,
        })),
      }));
      if (data.aiUsed) {
        toast.success("Черновик готов — проверьте и поправьте текст");
      } else {
        toast.info("ИИ-оформление пока отключено. Текст скопирован как есть — отредактируйте вручную.");
      }
    } catch {
      toast.error("Не удалось сгенерировать черновик");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.roleTitle.trim()) {
      toast.error("Имя и род занятий обязательны");
      return;
    }
    setSaving(true);
    try {
      const payload: ProfilePayload = { ...form };
      if (mode === "create") {
        const res = await fetch("/api/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка сохранения");
        setResult(data);
      } else {
        const res = await fetch(`/api/profiles/${token}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка сохранения");
        toast.success("Изменения сохранены");
        router.push(`/${data.slug}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  if (result) {
    return <SuccessScreen slug={result.slug} editToken={result.editToken} />;
  }

  const hasDraft = form.bioPolished || form.works.some((w) => w.descriptionPolished);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "create" ? "Новое портфолио" : "Редактирование"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Заполните тезисно — ИИ поможет оформить, а вы поправите финальный текст.
        </p>
      </div>

      {/* Профиль */}
      <Card>
        <CardHeader>
          <CardTitle>О себе</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-4">
            <ImageUpload
              value={form.avatarUrl}
              onChange={(url) => update("avatarUrl", url)}
              aspect="square"
              className="w-28 shrink-0"
              label="Фото"
            />
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Имя *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Айгерим"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role">Чем занимаетесь *</Label>
                <Input
                  id="role"
                  value={form.roleTitle}
                  onChange={(e) => update("roleTitle", e.target.value)}
                  placeholder="Мастер маникюра"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bioRaw">О себе — тезисно</Label>
            <Textarea
              id="bioRaw"
              value={form.bioRaw}
              onChange={(e) => update("bioRaw", e.target.value)}
              placeholder="5 лет опыта, работаю с гель-лаком, обучалась у ...  — можно списком, не литературно"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Формат отображения */}
      <Card>
        <CardHeader>
          <CardTitle>Как показывать работы</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {LAYOUTS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => update("layout", l.value)}
              className={cn(
                "flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors",
                form.layout === l.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-input hover:bg-muted",
              )}
            >
              <span className="text-sm font-medium">{l.title}</span>
              <span className="text-xs text-muted-foreground">{l.desc}</span>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Работы */}
      <Card>
        <CardHeader>
          <CardTitle>Работы</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {form.works.map((work, i) => (
            <div key={i} className="flex flex-col gap-3">
              {i > 0 && <Separator />}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Работа {i + 1}
                </span>
                {form.works.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWork(i)}
                    className="h-7 text-muted-foreground"
                  >
                    <Trash2 className="size-3.5" />
                    Удалить
                  </Button>
                )}
              </div>

              <div
                className={cn(
                  "grid gap-3",
                  form.layout === "before_after" ? "grid-cols-2" : "grid-cols-1",
                )}
              >
                <ImageUpload
                  value={work.imageUrl}
                  onChange={(url) => updateWork(i, { imageUrl: url })}
                  label={form.layout === "before_after" ? "До" : undefined}
                />
                {form.layout === "before_after" && (
                  <ImageUpload
                    value={work.afterImageUrl}
                    onChange={(url) => updateWork(i, { afterImageUrl: url })}
                    label="После"
                  />
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Категория / тип работы</Label>
                <Input
                  value={work.category}
                  onChange={(e) => updateWork(i, { category: e.target.value })}
                  placeholder="Например: Маникюр с дизайном"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Описание — тезисно</Label>
                <Textarea
                  value={work.descriptionRaw}
                  onChange={(e) => updateWork(i, { descriptionRaw: e.target.value })}
                  placeholder="что делали, материалы, сколько заняло — коротко"
                  rows={2}
                />
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addWork} className="self-start">
            <Plus className="size-4" />
            Добавить работу
          </Button>
        </CardContent>
      </Card>

      {/* Контакты */}
      <Card>
        <CardHeader>
          <CardTitle>Контакты и соцсети</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ContactField label="Телефон" value={form.phone} onChange={(v) => update("phone", v)} placeholder="+7 700 000 00 00" />
          <ContactField label="WhatsApp" value={form.whatsapp} onChange={(v) => update("whatsapp", v)} placeholder="+7 700 000 00 00" />
          <ContactField label="Telegram" value={form.telegram} onChange={(v) => update("telegram", v)} placeholder="@username" />
          <ContactField label="VK" value={form.vk} onChange={(v) => update("vk", v)} placeholder="vk.com/username" />
          <ContactField label="Instagram" value={form.instagram} onChange={(v) => update("instagram", v)} placeholder="@username" />
        </CardContent>
      </Card>

      {/* ИИ + готовый текст */}
      <Card>
        <CardHeader>
          <CardTitle>Готовый текст</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleGenerate}
            disabled={generating}
            className="self-start"
          >
            {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {hasDraft ? "Обновить черновик" : "Оформить черновик с ИИ"}
          </Button>

          {hasDraft && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tagline">Слоган</Label>
                <Input
                  id="tagline"
                  value={form.tagline}
                  onChange={(e) => update("tagline", e.target.value)}
                  placeholder="Короткая фраза о вас"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bioPolished">Готовое описание</Label>
                <Textarea
                  id="bioPolished"
                  value={form.bioPolished}
                  onChange={(e) => update("bioPolished", e.target.value)}
                  rows={4}
                />
              </div>
              {form.works.some((w) => w.descriptionPolished) && (
                <div className="flex flex-col gap-3">
                  {form.works.map((work, i) =>
                    work.descriptionPolished || work.descriptionRaw ? (
                      <div key={i} className="flex flex-col gap-1.5">
                        <Label>Описание работы {i + 1}</Label>
                        <Textarea
                          value={work.descriptionPolished}
                          onChange={(e) => updateWork(i, { descriptionPolished: e.target.value })}
                          rows={2}
                        />
                      </div>
                    ) : null,
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} size="lg" className="flex-1">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {mode === "create" ? "Опубликовать" : "Сохранить изменения"}
        </Button>
        {mode === "edit" && initialSlug && (
          <Link
            href={`/${initialSlug}`}
            target="_blank"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            <Eye className="size-4" />
            Открыть
          </Link>
        )}
      </div>
    </div>
  );
}

function ContactField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function SuccessScreen({ slug, editToken }: { slug: string; editToken: string }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${origin}/${slug}`;
  const editUrl = `${origin}/edit/${editToken}`;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Портфолио опубликовано!</h1>
        <p className="text-sm text-muted-foreground">
          Сохраните ссылку для редактирования — по ней можно вернуться и поправить страницу.
        </p>
      </div>

      <LinkRow label="Ссылка на портфолио" url={publicUrl} accent />
      <LinkRow label="Приватная ссылка для правок — сохраните её!" url={editUrl} />

      <Link href={`/${slug}`} className={buttonVariants({ size: "lg" })}>
        <ExternalLink className="size-4" />
        Открыть портфолио
      </Link>
    </div>
  );
}

function LinkRow({ label, url, accent }: { label: string; url: string; accent?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Скопировано");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className={cn("text-sm font-medium", accent && "text-primary")}>{label}</span>
      <div className="flex items-center gap-2">
        <Input readOnly value={url} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
        <Button type="button" variant="outline" size="icon" onClick={copy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
