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
  GripVertical,
  Lock,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/image-upload";
import { MultiImageUpload } from "@/components/multi-image-upload";
import { cn } from "@/lib/utils";
import { PROFESSIONS } from "@/lib/professions";
import { CONTACT_TYPES } from "@/lib/contacts";
import { rememberVizitka, forgetVizitka } from "@/lib/my-vizitki";
import type { ProfilePayload } from "@/lib/types";

type Layout = ProfilePayload["layout"];
type Profession = ProfilePayload["profession"];

interface FormWork {
  uid?: string; // локальный id для перетаскивания (не уходит на сервер)
  category: string;
  imageUrl: string;
  afterImageUrl: string;
  images: string[];
  descriptionRaw: string;
  descriptionPolished: string;
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export interface PortfolioFormInitial extends Omit<ProfilePayload, "works"> {
  works: FormWork[];
}

interface PortfolioFormProps {
  mode: "create" | "edit";
  token?: string;
  initial?: PortfolioFormInitial;
  initialSlug?: string;
  views?: number;
}

const LAYOUTS: { value: Layout; title: string; desc: string }[] = [
  { value: "gallery", title: "Галерея фото", desc: "Фотографы, бьюти-мастера" },
  { value: "cases", title: "Кейсы с текстом", desc: "Репетиторы, консультанты" },
  { value: "before_after", title: "До / После", desc: "Ремонт, бьюти" },
];

function emptyWork(): FormWork {
  return {
    uid: uid(),
    category: "",
    imageUrl: "",
    afterImageUrl: "",
    images: [],
    descriptionRaw: "",
    descriptionPolished: "",
  };
}

/** Гарантирует uid у каждой работы (данные из БД приходят без него). */
function withUids(state: PortfolioFormInitial): PortfolioFormInitial {
  return { ...state, works: state.works.map((w) => ({ ...w, uid: w.uid || uid() })) };
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
    profession: "beauty",
    listed: true,
    phone: "",
    whatsapp: "",
    telegram: "",
    viber: "",
    vk: "",
    odnoklassniki: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    facebook: "",
    email: "",
    website: "",
    recoveryEmail: "",
    works: [emptyWork()],
  };
}

function viewsWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "просмотр";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "просмотра";
  return "просмотров";
}

export function PortfolioForm({ mode, token, initial, initialSlug, views }: PortfolioFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<PortfolioFormInitial>(() => withUids(initial ?? blankState()));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setForm((prev) => {
      const from = prev.works.findIndex((w) => w.uid === active.id);
      const to = prev.works.findIndex((w) => w.uid === over.id);
      if (from < 0 || to < 0) return prev;
      return { ...prev, works: arrayMove(prev.works, from, to) };
    });
  }
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
        rememberVizitka({
          slug: data.slug,
          editToken: data.editToken,
          name: form.name,
          roleTitle: form.roleTitle,
        });
        setResult(data);
      } else {
        const res = await fetch(`/api/profiles/${token}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка сохранения");
        if (token) {
          rememberVizitka({
            slug: data.slug,
            editToken: token,
            name: form.name,
            roleTitle: form.roleTitle,
          });
        }
        toast.success("Изменения сохранены");
        router.push(`/${data.slug}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!token) return;
    if (!window.confirm("Удалить визитку навсегда? Это действие необратимо.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/profiles/${token}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Не удалось удалить");
      forgetVizitka(token);
      toast.success("Визитка удалена");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось удалить");
      setDeleting(false);
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
        {mode === "edit" && typeof views === "number" && (
          <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
            <Eye className="size-3.5" />
            {views} {viewsWord(views)}
          </span>
        )}
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

          <div className="flex flex-col gap-1.5">
            <Label>Сфера</Label>
            <div className="flex flex-wrap gap-2">
              {PROFESSIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => update("profession", p.value as Profession)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    form.profession === p.value
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                      : "border-input text-muted-foreground hover:bg-muted",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              Нужно для фильтра в общей галерее.
            </span>
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
        <CardContent className="flex flex-col gap-4">
          {form.works.length > 1 && (
            <p className="text-xs text-muted-foreground">
              Перетаскивайте работы за значок слева, чтобы менять порядок.
            </p>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={form.works.map((w) => w.uid ?? "")}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-3">
                {form.works.map((work, i) => (
                  <SortableWork
                    key={work.uid}
                    work={work}
                    index={i}
                    total={form.works.length}
                    layout={form.layout}
                    onUpdate={(patch) => updateWork(i, patch)}
                    onRemove={() => removeWork(i)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button type="button" variant="outline" onClick={addWork} className="self-start">
            <Plus className="size-4" />
            Добавить работу
          </Button>
        </CardContent>
      </Card>

      {/* Восстановление доступа */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Lock className="size-4 text-muted-foreground" />
            Восстановление доступа
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <Label htmlFor="recoveryEmail">Приватный email для восстановления</Label>
          <Input
            id="recoveryEmail"
            type="email"
            value={form.recoveryEmail}
            onChange={(e) => update("recoveryEmail", e.target.value)}
            placeholder="you@mail.com"
          />
          <span className="text-xs text-muted-foreground">
            Не показывается на странице визитки. Если потеряете ссылку для редактирования — по
            адресу визитки и этому email сможете восстановить доступ на странице{" "}
            <Link href="/restore" className="underline underline-offset-2">
              /restore
            </Link>
            .
          </span>
        </CardContent>
      </Card>

      {/* Контакты */}
      <Card>
        <CardHeader>
          <CardTitle>Контакты и соцсети</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CONTACT_TYPES.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.key} className="flex flex-col gap-1.5">
                <Label className="flex items-center gap-1.5">
                  <Icon className="size-3.5 text-muted-foreground" />
                  {c.label}
                </Label>
                <Input
                  value={form[c.key]}
                  onChange={(e) => update(c.key, e.target.value)}
                  placeholder={c.placeholder}
                />
              </div>
            );
          })}
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

      {/* Галерея opt-in */}
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-input bg-card p-4">
        <input
          type="checkbox"
          checked={form.listed}
          onChange={(e) => update("listed", e.target.checked)}
          className="mt-0.5 size-4 accent-primary"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Показывать в общей галерее примеров</span>
          <span className="text-xs text-muted-foreground">
            Ваша визитка появится на главной странице vizitka.me. Выключите, если хотите держать
            ссылку только для себя — страница всё равно открывается по прямой ссылке.
          </span>
        </span>
      </label>

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

      {mode === "edit" && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-muted-foreground hover:text-destructive"
          >
            {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            Удалить визитку
          </Button>
        </div>
      )}
    </div>
  );
}

function SortableWork({
  work,
  index,
  total,
  layout,
  onUpdate,
  onRemove,
}: {
  work: FormWork;
  index: number;
  total: number;
  layout: Layout;
  onUpdate: (patch: Partial<FormWork>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: work.uid ?? "",
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex size-7 cursor-grab touch-none items-center justify-center rounded text-muted-foreground hover:bg-muted active:cursor-grabbing"
            aria-label="Перетащить работу"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">Работа {index + 1}</span>
        </div>
        {total > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-7 text-muted-foreground"
          >
            <Trash2 className="size-3.5" />
            Удалить
          </Button>
        )}
      </div>

      {layout === "before_after" ? (
        <div className="grid grid-cols-2 gap-3">
          <ImageUpload value={work.imageUrl} onChange={(url) => onUpdate({ imageUrl: url })} label="До" />
          <ImageUpload
            value={work.afterImageUrl}
            onChange={(url) => onUpdate({ afterImageUrl: url })}
            label="После"
          />
        </div>
      ) : (
        <MultiImageUpload
          value={work.images}
          onChange={(urls) => onUpdate({ images: urls })}
          label="Фото работы — можно несколько"
        />
      )}

      <div className="flex flex-col gap-1.5">
        <Label>Категория / тип работы</Label>
        <Input
          value={work.category}
          onChange={(e) => onUpdate({ category: e.target.value })}
          placeholder="Например: Маникюр с дизайном"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Описание — тезисно</Label>
        <Textarea
          value={work.descriptionRaw}
          onChange={(e) => onUpdate({ descriptionRaw: e.target.value })}
          placeholder="что делали, материалы, сколько заняло — коротко"
          rows={2}
        />
      </div>
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
