"use client";

import { useId, useState } from "react";
import { CATEGORY_COLORS, type Category, type CategoryColor } from "@/lib/types";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({ variant = "secondary", size = "md", className, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-full font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        variant === "primary" && "bg-accent text-white shadow-soft hover:bg-accent-deep",
        variant === "secondary" && "border border-line-strong bg-card text-ink hover:bg-surface",
        variant === "ghost" && "text-muted hover:bg-surface hover:text-ink",
        variant === "danger" && "border border-danger/40 bg-card text-danger hover:bg-danger/10",
        className,
      )}
      {...rest}
    />
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cx("rounded-3xl border border-line bg-card p-5 shadow-soft sm:p-6", className)}>{children}</section>;
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label?: React.ReactNode;
  onChange?: (v: string) => void;
  hint?: React.ReactNode;
};

export function Input({ label, hint, className, onChange, ...rest }: InputProps) {
  const id = useId();
  return (
    <div className="flex flex-col">
      {label && (
        <label htmlFor={id} className="mb-1.5 text-sm font-bold">
          {label}
        </label>
      )}
      <input
        id={id}
        onChange={(e) => onChange?.(e.target.value)}
        className={cx(
          "w-full rounded-2xl border border-line-strong bg-card px-4 py-2.5 text-sm outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/20",
          className,
        )}
        {...rest}
      />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
      {children}
    </div>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" className="rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-ink">
      {children}
    </div>
  );
}

export function Spinner({ label = "読み込み中…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted" role="status">
      <span className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
      {label}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl bg-surface px-4 py-3">
      <div className="text-[11px] font-bold text-muted">{label}</div>
      <div className="font-display text-xl font-bold">{value}</div>
      {sub && <div className="text-[11px] text-muted">{sub}</div>}
    </div>
  );
}

export function categoryColorVar(color: CategoryColor): string {
  return `var(--cat-${color})`;
}

export function CategoryChip({ category, size = "sm" }: { category: Category; size?: "sm" | "md" }) {
  return (
    <span
      className={cx("cat-chip inline-flex items-center rounded-full font-bold", size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs")}
      style={{ background: categoryColorVar(category.color) }}
    >
      {category.name}
    </span>
  );
}

export function ColorSwatches({ value, onChange }: { value: CategoryColor; onChange: (c: CategoryColor) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="色">
      {CATEGORY_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={`色: ${c}`}
          onClick={() => onChange(c)}
          className={cx("size-6 rounded-full border-2 transition", value === c ? "border-ink scale-110" : "border-transparent hover:scale-110")}
          style={{ background: categoryColorVar(c) }}
        />
      ))}
    </div>
  );
}

/**
 * カテゴリの選択。「なし」と各カテゴリに加えて、その場で新しいカテゴリを追加できる。
 */
export function CategoryPicker({
  categories,
  value,
  onChange,
  onCreate,
}: {
  categories: Category[];
  value: string | null;
  onChange: (id: string | null) => void;
  onCreate?: (name: string) => Promise<Category>;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!onCreate) return;
    setBusy(true);
    setError(null);
    try {
      const c = await onCreate(name);
      onChange(c.id);
      setName("");
      setAdding(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="カテゴリ">
        <button
          type="button"
          role="radio"
          aria-checked={value === null}
          onClick={() => onChange(null)}
          className={cx(
            "rounded-full border px-3 py-1 text-xs font-bold transition",
            value === null ? "border-ink bg-ink text-background" : "border-line bg-card text-muted hover:bg-surface",
          )}
        >
          なし
        </button>
        {categories.map((c) => {
          const active = value === c.id;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(active ? null : c.id)}
              className={cx("cat-chip rounded-full border-2 px-3 py-1 text-xs font-bold transition", active ? "border-ink" : "border-transparent opacity-75 hover:opacity-100")}
              style={{ background: categoryColorVar(c.color) }}
            >
              {c.name}
            </button>
          );
        })}
        {onCreate && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-full border border-dashed border-line-strong px-3 py-1 text-xs font-bold text-muted hover:border-accent hover:text-accent-deep"
          >
            ＋ 新しいカテゴリ
          </button>
        )}
      </div>
      {adding && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submit();
              }
              if (e.key === "Escape") setAdding(false);
            }}
            placeholder="カテゴリ名（例: 詩）"
            aria-label="新しいカテゴリ名"
            className="rounded-full border border-line-strong bg-card px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
          <Button size="sm" variant="primary" onClick={submit} disabled={busy || name.trim() === ""}>
            追加
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
            やめる
          </Button>
          {error && <span className="text-xs text-danger">{error}</span>}
        </div>
      )}
    </div>
  );
}
