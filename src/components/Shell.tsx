"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/components/AppProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Spinner, cx } from "@/components/ui";

const PUBLIC_PATHS = ["/login", "/reset-password", "/about"];

const NAV = [
  { href: "/", label: "日記", icon: "📖" },
  { href: "/write", label: "書く", icon: "✍️" },
  { href: "/settings", label: "設定", icon: "⚙️" },
  { href: "/about", label: "思い", icon: "🕊️" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { mode, ready, user } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  // 未ログインなら /login へ、ログイン済みで /login にいるなら日記へ
  useEffect(() => {
    if (!ready || mode === "local") return;
    if (!user && !isPublic) router.replace("/login");
    if (user && pathname === "/login") router.replace("/");
  }, [ready, mode, user, isPublic, pathname, router]);

  const guarded = mode === "supabase" && (!ready || (!user && !isPublic));

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-wide">
            <span className="grid size-8 place-items-center rounded-full bg-accent-soft text-base">🕊️</span>
            こころ日記
          </Link>
          {user && (
            <nav className="ml-auto hidden items-center gap-1 sm:flex">
              {NAV.map((n) => {
                const active = n.href === "/" ? pathname === "/" || pathname === "/entry" : pathname.startsWith(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={cx(
                      "rounded-full px-3 py-1.5 text-sm font-bold transition",
                      active ? "bg-accent-soft text-accent-deep" : "text-muted hover:bg-surface hover:text-ink",
                    )}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          )}
          <span className={cx(!user && "ml-auto")}>
            <ThemeToggle />
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-24 sm:py-8 sm:pb-10">{guarded ? <Spinner /> : children}</main>

      {user && (
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-background/95 backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-3xl justify-around px-2 py-2">
            {NAV.map((n) => {
              const active = n.href === "/" ? pathname === "/" || pathname === "/entry" : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cx(
                    "flex flex-col items-center rounded-2xl px-4 py-1 text-[11px] font-bold",
                    active ? "text-accent-deep" : "text-muted",
                  )}
                >
                  <span className="text-xl">{n.icon}</span>
                  {n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
