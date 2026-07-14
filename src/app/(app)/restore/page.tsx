"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RestorePage() {
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [editUrl, setEditUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setEditUrl(null);
    try {
      const res = await fetch("/api/profiles/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: extractSlug(slug), email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Не удалось восстановить доступ");
      setEditUrl(`${window.location.origin}/edit/${data.editToken}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось восстановить доступ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-14">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Восстановить доступ</h1>
        <p className="text-sm text-muted-foreground">
          Если вы потеряли ссылку для редактирования визитки, укажите её адрес и приватный email
          восстановления, указанный при создании.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 text-base">
            <KeyRound className="size-4 text-muted-foreground" />
            Данные визитки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="slug">Адрес визитки</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="vizitka.me/aigerim или просто aigerim"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email восстановления</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@mail.com"
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Найти ссылку
            </Button>
          </form>
        </CardContent>
      </Card>

      {editUrl && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <p className="text-sm text-muted-foreground">
              Доступ восстановлен. Сохраните эту ссылку — она снова открывает редактирование.
            </p>
            <Link href={editUrl} className={buttonVariants()}>
              <ExternalLink className="size-4" />
              Перейти к редактированию
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** Позволяет вставить как полный URL, так и просто слаг. */
function extractSlug(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/([^/]+)\/?$/);
  return match ? match[1] : trimmed;
}
