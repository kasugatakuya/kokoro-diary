"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { useHydrated } from "@/components/hooks";
import { Button, Card, CategoryChip, ErrorBox, Spinner } from "@/components/ui";
import { formatDateJa, formatTime } from "@/lib/dates";
import { charCount, sortEntries } from "@/lib/stats";

export function EntryView() {
  const { entries, entriesLoaded, categories, deleteEntry } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const hydrated = useHydrated();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(() => sortEntries(entries), [entries]);
  const index = sorted.findIndex((e) => e.id === id);
  const entry = index >= 0 ? sorted[index] : undefined;
  const newer = index > 0 ? sorted[index - 1] : undefined;
  const sameDayCount = entry ? sorted.filter((e) => e.entryDate === entry.entryDate).length : 0;
  const category = entry?.categoryId ? categories.find((c) => c.id === entry.categoryId) : undefined;
  const older = index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : undefined;

  if (!hydrated || !entriesLoaded) return <Spinner />;
  if (!entry) {
    return (
      <Card>
        <ErrorBox>その日記は見つかりませんでした。</ErrorBox>
        <div className="mt-4">
          <Link href="/">
            <Button>日記へ戻る</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const remove = async () => {
    if (!window.confirm("この日記を削除します。元に戻せません。よろしいですか？")) return;
    setBusy(true);
    try {
      await deleteEntry(entry.id);
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/" className="text-muted hover:text-ink">
          ← 日記
        </Link>
        <span className="ml-auto flex gap-2">
          <Link href={`/write?id=${entry.id}`}>
            <Button size="sm">✏️ 直す</Button>
          </Link>
          <Button size="sm" variant="danger" onClick={remove} disabled={busy}>
            削除
          </Button>
        </span>
      </div>

      <Card>
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>{formatDateJa(entry.entryDate)}</span>
          <span className="tabular-nums">{formatTime(entry.createdAt)}</span>
          {category && <CategoryChip category={category} size="md" />}
          {sameDayCount > 1 && <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-bold">この日 {sameDayCount} 件</span>}
        </div>
        {entry.title && <h1 className="mt-3 font-display text-2xl font-bold">{entry.title}</h1>}
        <div className="prose-diary mt-4 text-[15px]">{entry.body || <span className="text-muted">（本文なし）</span>}</div>
        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-muted">
          <span>{charCount(entry.body)} 文字</span>
          {entry.updatedAt !== entry.createdAt && <span>最終更新 {formatTime(entry.updatedAt)}</span>}
        </div>
        {error && (
          <div className="mt-3">
            <ErrorBox>{error}</ErrorBox>
          </div>
        )}
      </Card>

      <div className="text-center">
        <Link href={`/write?date=${entry.entryDate}${entry.categoryId ? `&category=${entry.categoryId}` : ""}`}>
          <Button variant="primary">✍️ この日にもうひとつ書く</Button>
        </Link>
      </div>

      <div className="flex justify-between text-sm">
        {older ? (
          <Link href={`/entry?id=${older.id}`} className="rounded-full px-3 py-1.5 text-muted hover:bg-surface hover:text-ink">
            ← {formatDateJa(older.entryDate, false)}
          </Link>
        ) : (
          <span />
        )}
        {newer && (
          <Link href={`/entry?id=${newer.id}`} className="rounded-full px-3 py-1.5 text-muted hover:bg-surface hover:text-ink">
            {formatDateJa(newer.entryDate, false)} →
          </Link>
        )}
      </div>
    </div>
  );
}
