"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, FolderHeart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" className="text-base font-semibold tracking-tight">
          vizitka<span className="text-primary">.me</span>
        </Link>

        <nav className="flex items-center gap-1.5">
          <Link
            href="/my"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              pathname === "/my" && "bg-muted",
            )}
          >
            <FolderHeart className="size-4" />
            <span className="hidden sm:inline">Мои визитки</span>
          </Link>
          <Link href="/create" className={buttonVariants({ size: "sm" })}>
            <Plus className="size-4" />
            Создать
          </Link>
        </nav>
      </div>
    </header>
  );
}
