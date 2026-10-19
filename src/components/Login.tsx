"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Button, Card, ErrorBox, Input, Notice, cx } from "@/components/ui";

type Tab = "signin" | "signup" | "forgot";

export function Login() {
  const { mode, signIn, signUp, sendPasswordReset } = useApp();
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (mode === "local") {
    return (
      <Card>
        <h1 className="font-display text-xl font-bold">ローカルモードで動作しています</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Supabase の設定が無いため、日記はこのブラウザの中だけに保存されます。アカウント機能を使うには README の手順で環境変数を設定してください。
        </p>
      </Card>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (tab === "signin") {
        await signIn(email, password);
      } else if (tab === "signup") {
        const { needsConfirmation } = await signUp(email, password);
        if (needsConfirmation) {
          setNotice("確認メールを送りました。メール内のリンクを開いてから、ログインしてください。");
          setTab("signin");
        }
      } else {
        await sendPasswordReset(email);
        setNotice("パスワード再設定のメールを送りました。メール内のリンクを開いてください。");
        setTab("signin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 text-center">
        <div className="text-5xl">🕊️</div>
        <h1 className="mt-3 font-display text-2xl font-bold">こころ日記</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          心の中で思ったことを、なんでも書いてしまっておく場所。
          <br />
          あなた以外は誰も読めません。
        </p>
      </div>
      <Card>
        <div className="mb-5 flex rounded-full bg-surface p-1">
          {(
            [
              ["signin", "ログイン"],
              ["signup", "新規登録"],
            ] as const
          ).map(([t, label]) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setError(null);
              }}
              className={cx(
                "flex-1 rounded-full py-2 text-sm font-bold transition",
                tab === t || (tab === "forgot" && t === "signin") ? "bg-card text-ink shadow-soft" : "text-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Input label="メールアドレス" type="email" autoComplete="email" required value={email} onChange={setEmail} placeholder="you@example.com" />
          {tab !== "forgot" && (
            <Input
              label="パスワード"
              type="password"
              autoComplete={tab === "signup" ? "new-password" : "current-password"}
              required
              minLength={6}
              value={password}
              onChange={setPassword}
              placeholder="6 文字以上"
            />
          )}
          {error && <ErrorBox>{error}</ErrorBox>}
          {notice && <Notice>{notice}</Notice>}
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
            {busy ? "送信中…" : tab === "signin" ? "ログイン" : tab === "signup" ? "登録する" : "再設定メールを送る"}
          </Button>
        </form>
        <div className="mt-4 flex items-center justify-center gap-3 text-xs text-muted">
          <Link href="/about" className="underline">
            この日記について
          </Link>
          <span>・</span>
          {tab === "forgot" ? (
            <button type="button" className="underline" onClick={() => setTab("signin")}>
              ログインに戻る
            </button>
          ) : (
            <button type="button" className="underline" onClick={() => setTab("forgot")}>
              パスワードを忘れた場合
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
