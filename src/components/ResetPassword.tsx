"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Button, Card, ErrorBox, Input, Notice } from "@/components/ui";

export function ResetPassword() {
  const { user, ready, updatePassword } = useApp();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("確認用のパスワードが一致しません。");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updatePassword(password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="font-display text-xl font-bold">パスワードの再設定</h1>
        {ready && !user ? (
          <div className="mt-4">
            <Notice>再設定用のリンクが無効か、期限切れです。ログイン画面から再度メールを送ってください。</Notice>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4">
            <Input label="新しいパスワード" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={setPassword} />
            <Input label="新しいパスワード（確認）" type="password" autoComplete="new-password" required minLength={6} value={confirm} onChange={setConfirm} />
            {error && <ErrorBox>{error}</ErrorBox>}
            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
              {busy ? "更新中…" : "パスワードを更新"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
