// Чистый модуль без серверных зависимостей — безопасно импортировать в клиентские компоненты.

export type Profession = "beauty" | "photo" | "tutor" | "repair" | "other";

export const PROFESSIONS: { value: Profession; label: string }[] = [
  { value: "beauty", label: "Бьюти-мастер" },
  { value: "photo", label: "Фотограф" },
  { value: "tutor", label: "Репетитор" },
  { value: "repair", label: "Ремонт / отделка" },
  { value: "other", label: "Другое" },
];

export function professionLabel(value: string): string {
  return PROFESSIONS.find((p) => p.value === value)?.label ?? "Другое";
}
