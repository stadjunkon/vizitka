import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Inter и JetBrains Mono поддерживают кириллицу (Geist — нет).
// Имена переменных совпадают с ожидаемыми в globals.css (@theme).
const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "vizitka.me — портфолио за 5 минут",
  description:
    "Соберите портфолио из фото ваших работ за 5 минут. Для мастеров, фотографов, репетиторов.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
