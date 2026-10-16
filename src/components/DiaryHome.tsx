"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { useHydrated } from "@/components/hooks";
import { Button, Card, CategoryChip, ErrorBox, Spinner, Stat, categoryColorVar, cx } from "@/components/ui";
import { formatDateJa, formatMonthJa, formatTime, monthGrid, relativeDays, shiftMonth, todayKey } from "@/lib/dates";
import { charCount, currentStreak, filterEntries, groupByMonth } from "@/lib/stats";
import type { Entry } from "@/lib/types";

function excerpt(body: string, max = 90): string {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

function Calendar({
  entries,
  selectedDay,
  onSelectDay,
  year,
  month,
  onMove,
}: {
  entries: Entry[];
  selectedDay: string | null;
  onSelectDay: (key: string | null) => void;
  year: number;
  month: number;
  onMove: (delta: number) => void;
}) {
  const byDay = useMemo(() => {
    const m = new Map<string, Entry[]>();
    for (const e of entries) {
      if (!m.has(e.entryDate)) m.set(e.entryDate, []);
      m.get(e.entryDate)!.push(e);
    }
    return m;
  }, [entries]);
  const today = todayKey();
  const weeks = monthGrid(year, month);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Button size="sm" variant="ghost" onClick={() => onMove(-1)} aria-label="前の月">
          ‹
        </Button>
        <span className="font-display text-sm font-bold">{formatMonthJa(year, month)}</span>
        <Button size="sm" variant="ghost" onClick={() => onMove(1)} aria-label="次の月">
          ›
        </Button>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] font-bold text-muted">
        {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((cell, ci) => {
            if (!cell.key) return <div key={ci} />;
            const dayEntries = byDay.get(cell.key) ?? [];
            const selected = selectedDay === cell.key;
            return (
              <button
                key={ci}
                type="button"
                onClick={() => onSelectDay(selected ? null : cell.key)}
                aria-label={`${formatDateJa(cell.key)}${dayEntries.length ? ` ${dayEntries.length}件` : ""}`}
                className={cx(
                  "mx-auto my-0.5 flex size-9 flex-col items-center justify-center rounded-full text-xs transition",
                  selected ? "bg-accent text-white" : dayEntries.length ? "bg-surface hover:bg-line" : "text-muted hover:bg-surface",
                  cell.key === today && !selected && "ring-2 ring-accent/50",
                )}
              >
                <span className={cx(dayEntries.length > 0 && !selected && "font-bold text-ink")}>{cell.day}</span>
                {dayEntries.length > 1 ? (
                  <span className={cx("mt-0.5 block rounded-full px-1 text-[9px] font-bold leading-3", selected ? "bg-white text-accent" : "bg-accent text-white")}>
                    {dayEntries.length}
                  </span>
                ) : dayEntries.length === 1 ? (
                  <span className={cx("mt-0.5 block size-1.5 rounded-full", selected ? "bg-white" : "bg-accent")} />
                ) : null}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function DiaryHome() {
  const { entries, entriesLoaded, categories, error, mode } = useApp();
  const hydrated = useHydrated();
  const [query, setQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [calendar, setCalendar] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  const today = todayKey();
  const todayEntries = entries.filter((e) => e.entryDate === today);
  const thisMonthKey = `${calendar.year}-${String(calendar.month).padStart(2, "0")}`;

  const filtered = useMemo(() => {
    const base = filterEntries(entries, { query, categoryId });
    return selectedDay ? base.filter((e) => e.entryDate === selectedDay) : base;
  }, [entries, query, selectedDay, categoryId]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const groups = useMemo(() => groupByMonth(filtered), [filtered]);
  const streak = useMemo(() => currentStreak(entries), [entries]);
  const monthCount = useMemo(() => entries.filter((e) => e.entryDate.startsWith(thisMonthKey)).length, [entries, thisMonthKey]);
  const latest = useMemo(() => (entries.length ? [...entries].sort((a, b) => b.entryDate.localeCompare(a.entryDate))[0].entryDate : null), [entries]);
  const filtering = query.trim() !== "" || selectedDay != null || categoryId != null;

  if (!hydrated || (!entriesLoaded && !error)) return <Spinner />;

  return (
    <div className="space-y-5">
      {error && <ErrorBox>{error}</ErrorBox>}

      {/* 今日 */}
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="text-xs font-bold text-muted">{formatDateJa(today)}</div>
          <h1 className="mt-1 font-display text-xl font-bold">
            {todayEntries.length === 0 ? "いま、どんな気持ちですか？" : `今日は ${todayEntries.length} 件書きました`}
          </h1>
          <p className="mt-1 text-sm text-muted">気持ちは一日のうちに何度も変わるもの。そのたびに、何件でも書いて大丈夫。</p>
        </div>
        <Link href="/write">
          <Button variant="primary" size="lg">
            ✍️ {todayEntries.length === 0 ? "書く" : "もうひとつ書く"}
          </Button>
        </Link>
      </Card>

      {/* 統計 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="書いた日記" value={entries.length} sub="件" />
        <Stat label="連続" value={streak} sub="日" />
        <Stat label={`${calendar.month}月`} value={monthCount} sub="件" />
        <Stat
          label="最近書いた日"
          value={latest ? relativeDays(latest) || formatDateJa(latest, false).replace(/^\d+年/, "") : "—"}
          sub={mode === "local" ? "ローカル保存" : undefined}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-[280px_1fr]">
        {/* カレンダー + フィルタ */}
        <div className="space-y-4">
          <Card className="p-4 sm:p-4">
            <Calendar
              entries={entries}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              year={calendar.year}
              month={calendar.month}
              onMove={(d) => setCalendar((c) => shiftMonth(c.year, c.month, d))}
            />
          </Card>
          <Card className="space-y-3 p-4 sm:p-4">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ことばで探す"
              aria-label="検索"
              className="w-full rounded-full border border-line-strong bg-card px-4 py-2 text-sm outline-none focus:border-accent"
            />
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="カテゴリで絞り込む">
                {categories.map((c) => {
                  const active = categoryId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setCategoryId(active ? null : c.id)}
                      className={cx("cat-chip rounded-full border-2 px-2.5 py-0.5 text-[11px] font-bold transition", active ? "border-ink" : "border-transparent opacity-70 hover:opacity-100")}
                      style={{ background: categoryColorVar(c.color) }}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            )}
            {filtering && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setQuery("");
                  setSelectedDay(null);
                  setCategoryId(null);
                }}
              >
                ✕ 絞り込みを解除
              </Button>
            )}
          </Card>
        </div>

        {/* 一覧 */}
        <div className="space-y-6">
          {selectedDay && <div className="text-sm font-bold text-muted">{formatDateJa(selectedDay)} の日記</div>}
          {groups.length === 0 && (
            <Card className="py-12 text-center">
              <div className="text-3xl">🍃</div>
              <p className="mt-3 text-sm text-muted">
                {entries.length === 0 ? "まだ日記はありません。最初の一行を書いてみましょう。" : "条件に合う日記はありません。"}
              </p>
            </Card>
          )}
          {groups.map((g) => (
            <section key={g.month}>
              <h2 className="mb-2 px-1 font-display text-sm font-bold text-muted">{formatMonthJa(Number(g.month.slice(0, 4)), Number(g.month.slice(5)))}</h2>
              <ul className="space-y-2">
                {g.entries.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/entry?id=${e.id}`}
                      className="block rounded-3xl border border-line bg-card px-5 py-4 shadow-soft transition hover:border-line-strong hover:bg-surface/60"
                    >
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span>{formatDateJa(e.entryDate)}</span>
                        <span className="tabular-nums">{formatTime(e.createdAt)}</span>
                        {e.categoryId && categoryMap.get(e.categoryId) && <CategoryChip category={categoryMap.get(e.categoryId)!} />}
                        {relativeDays(e.entryDate) && <span className="rounded-full bg-surface px-2 py-0.5 font-bold">{relativeDays(e.entryDate)}</span>}
                        <span className="ml-auto">{charCount(e.body)} 文字</span>
                      </div>
                      {e.title && <div className="mt-1.5 font-display text-base font-bold">{e.title}</div>}
                      <p className="mt-1 text-sm leading-relaxed text-ink/80">{excerpt(e.body) || <span className="text-muted">（本文なし）</span>}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
