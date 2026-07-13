"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, FolderHeart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("text-[15px] font-[650] tracking-[0.01em] text-foreground", className)}>
      VIZITKA
      <sup className="ml-px text-[9px] font-medium text-muted-foreground">®</sup>
    </span>
  );
}

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-4 z-40 px-4">
      <div className="mx-auto flex h-13 w-full max-w-xl items-center justify-between gap-3 rounded-full bg-card py-2 pl-5 pr-2 shadow-[0_12px_40px_rgba(0,0,0,0.09),0_2px_8px_rgba(0,0,0,0.04)]">
        <Link href="/" aria-label="На главную">
          <Wordmark />
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/my"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-9 text-muted-foreground",
              pathname === "/my" && "bg-muted text-foreground",
            )}
          >
            <FolderHeart className="size-4" />
            <span className="hidden sm:inline">Мои визитки</span>
          </Link>
          <Link href="/create" className={cn(buttonVariants({ size: "sm" }), "h-9 px-4")}>
            <Plus className="size-4" />
            Создать
          </Link>
        </nav>
      </div>
    </header>
  );
}
