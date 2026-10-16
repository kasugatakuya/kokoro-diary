"use client";

import { useTheme } from "next-themes";
import { useHydrated } from "@/components/hooks";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const dark = hydrated && resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
      className="grid size-9 place-items-center rounded-full border border-line bg-card text-base transition hover:bg-surface"
    >
      {hydrated ? (dark ? "☀️" : "🌙") : ""}
    </button>
  );
}
