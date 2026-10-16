"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { useHydrated } from "@/components/hooks";
import { Button, Card, CategoryPicker, ErrorBox, Spinner, cx } from "@/components/ui";
import { formatDateJa, isValidDateKey, todayKey } from "@/lib/dates";
import { charCount } from "@/lib/stats";
import { SUGGESTED_CATEGORIES, type EntryInput } from "@/lib/types";

interface Draft extends EntryInput {
  savedAt: string;
}

const draftKey = (id: string | null) => `kokoro-diary:draft:${id ?? "new"}`;

function readDraft(id: string | null): Draft | null {
  try {
    const raw = localStorage.getItem(draftKey(id));
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

const PROMPTS = [
  "いま、いちばん心に残っていることは？",
  "今日、少しだけ嬉しかったことは？",
  "言えなかった言葉があれば、ここに。",
  "からだの調子はどうですか？",
  "明日の自分に、ひとこと。",
  "もやもやしていることを、そのまま書いてみる。",
];

export function WriteEntry() {
  const { entries, entriesLoaded, categories, createEntry, updateEntry, createCategory } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const hydrated = useHydrated();
  const existing = useMemo(() => (id ? entries.find((e) => e.id === id) : undefined), [entries, id]);

  const [entryDate, setEntryDate] = useState(() => params.get("date") && isValidDateKey(params.get("date")!) ? params.get("date")! : todayKey());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(() => params.get("category"));
  const [initialized, setInitialized] = useState(false);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prompt = useMemo(() => PROMPTS[new Date().getDate() % PROMPTS.length], []);

  // 初期化: 既存の日記 or 下書き
  useEffect(() => {
    if (initialized || !hydrated) return;
    if (id && !entriesLoaded) return;
    const draft = readDraft(id);
    const base: EntryInput | null = existing
      ? { entryDate: existing.entryDate, title: existing.title, body: existing.body, mood: null, categoryId: existing.categoryId }
      : null;
    const useDraft = draft && (!base || draft.body !== base.body || draft.title !== base.title);
    const src = useDraft ? draft : base;
    // 同期的な setState を避けるためマイクロタスクで反映
    queueMicrotask(() => {
      if (src) {
        setEntryDate(src.entryDate);
        setTitle(src.title);
        setBody(src.body);
        setCategoryId(src.categoryId ?? null);
      }
      setRestoredDraft(Boolean(useDraft));
      setInitialized(true);
    });
  }, [initialized, hydrated, id, entriesLoaded, existing]);

  // 下書きの自動保存
  useEffect(() => {
    if (!initialized) return;
    const t = setTimeout(() => {
      if (body.trim() === "" && title.trim() === "") {
        localStorage.removeItem(draftKey(id));
        return;
      }
      const draft: Draft = { entryDate, title, body, mood: null, categoryId, savedAt: new Date().toISOString() };
      localStorage.setItem(draftKey(id), JSON.stringify(draft));
    }, 400);
    return () => clearTimeout(t);
  }, [initialized, id, entryDate, title, body, categoryId]);

  // textarea の高さを内容に合わせる
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 320)}px`;
  }, [body, initialized]);

  const save = useCallback(async () => {
    if (body.trim() === "" && title.trim() === "") {
      setError("なにか一文字でも書いてから保存してください。");
      return;
    }
    if (!isValidDateKey(entryDate)) {
      setError("日付の形式が正しくありません。");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const input: EntryInput = { entryDate, title: title.trim(), body: body.replace(/\s+$/, ""), mood: null, categoryId };
      const saved = id ? await updateEntry(id, input) : await createEntry(input);
      localStorage.removeItem(draftKey(id));
      router.push(`/entry?id=${saved.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }, [body, title, entryDate, categoryId, id, updateEntry, createEntry, router]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save]);

  if (!initialized) return <Spinner />;
  if (id && entriesLoaded && !existing) {
    return (
      <Card>
        <ErrorBox>その日記は見つかりませんでした。</ErrorBox>
        <div className="mt-4">
          <Button onClick={() => router.push("/")}>日記へ戻る</Button>
        </div>
      </Card>
    );
  }

  const count = charCount(body);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-xl font-bold">{id ? "日記を直す" : "いまの気持ち"}</h1>
        <label className="ml-auto flex items-center gap-2 text-xs font-bold text-muted">
          日付
          <input
            type="date"
            value={entryDate}
            max={todayKey()}
            onChange={(e) => setEntryDate(e.target.value)}
            className="rounded-full border border-line-strong bg-card px-3 py-1.5 text-sm text-ink outline-none focus:border-accent"
          />
        </label>
      </div>

      {restoredDraft && (
        <div className="flex items-center justify-between rounded-2xl bg-accent-soft px-4 py-2 text-xs">
          <span>保存されていない下書きを復元しました。</span>
          <button
            type="button"
            className="font-bold underline"
            onClick={() => {
              localStorage.removeItem(draftKey(id));
              if (existing) {
                setTitle(existing.title);
                setBody(existing.body);
                setEntryDate(existing.entryDate);
                setCategoryId(existing.categoryId);
              } else {
                setTitle("");
                setBody("");
                setCategoryId(null);
              }
              setRestoredDraft(false);
            }}
          >
            破棄する
          </button>
        </div>
      )}

      <Card className="space-y-4">
        <div className="text-xs font-bold text-muted">{formatDateJa(entryDate)}</div>
        <div>
          <div className="mb-1.5 text-xs font-bold text-muted">カテゴリ</div>
          <CategoryPicker
            categories={categories}
            value={categoryId}
            onChange={setCategoryId}
            onCreate={(name) =>
              createCategory({
                name,
                color: SUGGESTED_CATEGORIES.find((c) => c.name === name.trim())?.color ?? (["rose", "amber", "leaf", "sky", "lavender", "slate", "peach", "mint"] as const)[categories.length % 8],
              })
            }
          />
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タイトル（なくても大丈夫）"
          aria-label="タイトル"
          className="w-full border-0 border-b border-line bg-transparent px-1 py-2 font-display text-lg font-bold outline-none placeholder:font-normal placeholder:text-muted/60 focus:border-accent"
        />
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={prompt}
          aria-label="本文"
          spellCheck={false}
          className="w-full resize-none bg-transparent px-1 py-1 text-[15px] leading-8 text-ink outline-none placeholder:text-muted/50"
        />
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
          <span className="text-xs text-muted">{count} 文字</span>
          <span className="hidden text-xs text-muted sm:inline">⌘/Ctrl + Enter で保存</span>
          <span className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={() => router.back()} disabled={busy}>
              やめる
            </Button>
            <Button variant="primary" onClick={save} disabled={busy} className={cx(busy && "opacity-70")}>
              {busy ? "保存中…" : id ? "保存する" : "しまっておく"}
            </Button>
          </span>
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
      </Card>
    </div>
  );
}
