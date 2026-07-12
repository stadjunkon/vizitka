import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const AUDIENCE = [
  { emoji: "💅", title: "Мастера бьюти-сферы", desc: "маникюр, тату, парикмахеры" },
  { emoji: "📷", title: "Фотографы", desc: "покажите лучшие кадры" },
  { emoji: "📚", title: "Репетиторы", desc: "кейсы и результаты учеников" },
  { emoji: "🔧", title: "Ремонт и отделка", desc: "было / стало" },
];

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl mx-auto flex-col items-center py-24 px-6 text-center gap-10">
        <div className="flex flex-col items-center gap-4">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">vizitka.me</span>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Портфолио из ваших работ за 5 минут
          </h1>
          <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            Вместо разрозненных фото в WhatsApp и хайлайтах — одна аккуратная страница.
            Вы вводите тезисы, ИИ помогает оформить текст, а финальное слово всегда за вами.
          </p>
        </div>

        <Link href="/create" className={buttonVariants({ size: "lg", className: "h-12 px-8 text-base" })}>
          Создать бесплатно
        </Link>

        <div className="grid grid-cols-2 gap-3 w-full mt-8">
          {AUDIENCE.map((a) => (
            <Card key={a.title} className="text-left">
              <CardContent className="flex flex-col gap-1">
                <span className="text-2xl">{a.emoji}</span>
                <span className="font-medium text-sm">{a.title}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{a.desc}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-zinc-400 max-w-md">
          Личный некоммерческий проект. Без аккаунтов и паролей — после публикации вы получите
          приватную ссылку для редактирования, сохраните её себе.
        </p>
      </main>
    </div>
  );
}
