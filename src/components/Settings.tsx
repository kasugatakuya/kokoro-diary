"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { useHydrated } from "@/components/hooks";
import { Button, Card, ColorSwatches, ErrorBox, Input, Notice, categoryColorVar, cx } from "@/components/ui";
import { todayKey } from "@/lib/dates";
import { toMarkdown } from "@/lib/stats";
import { SUGGESTED_CATEGORIES, type Category, type CategoryColor } from "@/lib/types";

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Settings() {
  const { mode, user, entries, categories, createCategory, updateCategory, deleteCategory, signOut, updatePassword, clearLocalData } = useApp();
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await updatePassword(password);
      setPassword("");
      setMsg({ ok: true, text: "パスワードを更新しました。" });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-bold">設定</h1>

      <Card className="space-y-3">
        <h2 className="font-display text-base font-bold">見た目</h2>
        <div className="flex rounded-full bg-surface p-1">
          {(
            [
              ["light", "ライト"],
              ["dark", "ダーク"],
              ["system", "端末に合わせる"],
            ] as const
          ).map(([t, label]) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={cx(
                "flex-1 rounded-full py-2 text-sm font-bold transition",
                hydrated && theme === t ? "bg-card text-ink shadow-soft" : "text-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <CategorySettings
        categories={categories}
        entries={entries}
        onCreate={createCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
      />

      <Card className="space-y-3">
        <h2 className="font-display text-base font-bold">書き出し</h2>
        <p className="text-sm text-muted">日記はあなたのものです。いつでも手元に取り出せます。</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => download(`kokoro-diary-${todayKey()}.md`, toMarkdown(entries, categories), "text/markdown")} disabled={entries.length === 0}>
            Markdown で保存
          </Button>
          <Button onClick={() => download(`kokoro-diary-${todayKey()}.json`, JSON.stringify(entries, null, 2), "application/json")} disabled={entries.length === 0}>
            JSON で保存
          </Button>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-display text-base font-bold">アカウント</h2>
        {mode === "local" ? (
          <>
            <Notice>
              ローカルモード: 日記はこのブラウザの中だけに保存されています。ブラウザのデータを消すと日記も消えるので、こまめに書き出してください。
            </Notice>
            <Button
              variant="danger"
              onClick={async () => {
                if (window.confirm("このブラウザに保存されている日記をすべて削除します。元に戻せません。よろしいですか？")) {
                  await clearLocalData();
                }
              }}
              disabled={entries.length === 0}
            >
              日記をすべて削除
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm">
              ログイン中: <span className="font-bold">{user?.email}</span>
            </p>
            <form onSubmit={changePassword} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Input label="新しいパスワード" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={setPassword} />
              </div>
              <Button type="submit" disabled={busy}>
                変更する
              </Button>
            </form>
            {msg && (msg.ok ? <Notice>{msg.text}</Notice> : <ErrorBox>{msg.text}</ErrorBox>)}
            <Button variant="ghost" onClick={signOut}>
              ログアウト
            </Button>
          </>
        )}
      </Card>

      <p className="px-1 text-xs leading-relaxed text-muted">
        <Link href="/about" className="underline">
          この日記について（作った思い）
        </Link>
        <br />
        この日記に公開機能はありません。{mode === "supabase" ? "データベース側でも「本人以外は読めない」設定（行レベルセキュリティ）になっています。" : ""}
      </p>
    </div>
  );
}

function CategorySettings({
  categories,
  entries,
  onCreate,
  onUpdate,
  onDelete,
}: {
  categories: Category[];
  entries: { categoryId: string | null }[];
  onCreate: (input: { name: string; color: CategoryColor }) => Promise<Category>;
  onUpdate: (id: string, input: { name: string; color: CategoryColor }) => Promise<Category>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<CategoryColor>("rose");
  const [editing, setEditing] = useState<{ id: string; name: string; color: CategoryColor } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const counts = new Map<string, number>();
  for (const e of entries) if (e.categoryId) counts.set(e.categoryId, (counts.get(e.categoryId) ?? 0) + 1);
  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  const suggestions = SUGGESTED_CATEGORIES.filter((s) => !categories.some((c) => c.name === s.name));

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-display text-base font-bold">カテゴリ</h2>
        <p className="mt-1 text-sm text-muted">思いをそのまま書く日も、詩や歌詞にする日も。自分の言葉で分けられます。</p>
      </div>

      {categories.length === 0 && <p className="text-sm text-muted">まだカテゴリはありません。なくても書けます。</p>}
      <ul className="space-y-2">
        {categories.map((c) => (
          <li key={c.id} className="rounded-2xl border border-line px-3 py-2">
            {editing?.id === c.id ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    aria-label="カテゴリ名"
                    className="flex-1 rounded-full border border-line-strong bg-card px-3 py-1.5 text-sm outline-none focus:border-accent"
                  />
                  <Button size="sm" variant="primary" onClick={() => run(async () => { await onUpdate(c.id, { name: editing.name, color: editing.color }); setEditing(null); })}>
                    保存
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    やめる
                  </Button>
                </div>
                <ColorSwatches value={editing.color} onChange={(col) => setEditing({ ...editing, color: col })} />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="size-4 shrink-0 rounded-full" style={{ background: categoryColorVar(c.color) }} />
                <span className="flex-1 text-sm font-bold">{c.name}</span>
                <span className="text-xs text-muted">{counts.get(c.id) ?? 0} 件</span>
                <Button size="sm" onClick={() => setEditing({ id: c.id, name: c.name, color: c.color })}>
                  編集
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    const n = counts.get(c.id) ?? 0;
                    const msg = n > 0 ? `「${c.name}」を削除します。${n} 件の日記は消えず「カテゴリなし」になります。よろしいですか？` : `「${c.name}」を削除します。よろしいですか？`;
                    if (window.confirm(msg)) void run(() => onDelete(c.id));
                  }}
                >
                  削除
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <form
        className="space-y-2 rounded-2xl bg-surface p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            await onCreate({ name, color });
            setName("");
          });
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="新しいカテゴリ名"
            aria-label="新しいカテゴリ名"
            className="flex-1 rounded-full border border-line-strong bg-card px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
          <Button type="submit" size="sm" variant="primary" disabled={name.trim() === ""}>
            追加
          </Button>
        </div>
        <ColorSwatches value={color} onChange={setColor} />
        {suggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-muted">
            例:
            {suggestions.map((sg) => (
              <button
                key={sg.name}
                type="button"
                onClick={() => run(() => onCreate({ name: sg.name, color: sg.color }))}
                className="cat-chip rounded-full px-2.5 py-0.5 font-bold opacity-80 hover:opacity-100"
                style={{ background: categoryColorVar(sg.color) }}
              >
                ＋ {sg.name}
              </button>
            ))}
          </div>
        )}
      </form>
      {error && <ErrorBox>{error}</ErrorBox>}
    </Card>
  );
}
