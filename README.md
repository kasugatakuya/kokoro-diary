# 心 日記 (kokoro-diary)

心の中で思ったことを、なんでも書いてしまっておく場所。自分だけの日記アプリです。
公開機能はありません。データベース側でも「本人以外は読めない・書けない」をルール（RLS）として強制しています。

## できること

- 日記を書く: 日付、タイトル（任意）、本文、カテゴリ（任意）。同じ日に何件でも書けます（気持ちが変わるたびに）。
- カテゴリ: 「思い」「詩」「歌詞」など、自分で名前と色を決めて分けられます。設定画面で追加・編集・削除、書く画面でもその場で追加できます。削除しても日記は消えません。書きかけは自動で下書き保存され、次に開いたときに復元されます。⌘/Ctrl + Enter で保存。
- 読み返す: 月ごとの一覧、カレンダー、ことばで検索、日付やカテゴリで絞り込み、前後の日記へ移動。
- 続ける: 書いた件数、連続日数、今月の件数。
- 持ち出す: Markdown / JSON で全件を書き出し。
- 見た目: ライト / ダーク / 端末に合わせる。
- アカウント: メールアドレス + パスワードでログイン、新規登録、パスワード再設定、パスワード変更。

## 2 つの動作モード

| モード | 条件 | 保存先 |
| --- | --- | --- |
| Supabase モード | 環境変数 `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` がある | Supabase（ログインした本人の行のみ） |
| ローカルモード | 環境変数がない | ブラウザの localStorage（同じブラウザでだけ読める） |

ローカルモードはセットアップ前の試用と自動テスト用です。本番は Supabase モードを使ってください。

## Supabase のセットアップ

1. [supabase.com](https://supabase.com) でプロジェクトを作成します（無料枠で十分です）。
2. ダッシュボードの **SQL Editor** を開き、`supabase/migrations/` の SQL を番号順（`0001_entries.sql` → `0002_categories.sql`）に貼り付けて実行します。テーブル、更新日時のトリガー、RLS ポリシーが作られます。
3. **Authentication → Providers → Email** が有効であることを確認します。
   - 「Confirm email」を ON にすると登録時に確認メールが届きます。自分専用なら OFF でも構いません。
4. **Authentication → URL Configuration** で次を設定します。
   - Site URL: 公開 URL（例 `https://kokoro-diary.vercel.app`）
   - Redirect URLs: `https://公開URL/reset-password` と、開発用に `http://localhost:3000/reset-password`
5. **Project Settings → API** の Project URL と anon (public) key を環境変数に設定します。

ローカル開発は `.env.local` に書きます（`.env.example` 参照）。

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Vercel では Settings → Environment Variables に同じ 2 つを追加して再デプロイします。

> anon key はブラウザに配られる公開用のキーです。日記を守っているのは RLS ポリシーなので、SQL を必ず実行してください。service_role key は使いません。

## サイトマップと検索エンジン

`/sitemap.xml` と `/robots.txt` をビルド時に生成します（`src/app/sitemap.ts`, `src/app/robots.ts`）。
検索に載せるのはログイン前に見える `/`, `/about`, `/login` だけで、書く・読む・設定のページは noindex にしています。

公開 URL は Vercel の本番ドメインを自動で使います。独自ドメインにした場合は環境変数 `NEXT_PUBLIC_SITE_URL` を設定してください。

Google Search Console に登録するときは、所有権確認のメタタグを `src/app/layout.tsx` の `metadata.verification.google` に入れ、サイトマップとして `sitemap.xml` を送信します。

## 開発

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 静的書き出し → out/
npm start          # out/ をローカル配信
npm run lint
npm run typecheck
npm test           # Vitest（日付・集計ロジック）
npm run e2e        # Playwright（ローカルモードでビルドして確認）
```

初回の E2E 実行前に `npx playwright install chromium` が必要です。

## 構成

- `src/lib/types.ts` … 日記・カテゴリの型（`mood` 列は未使用で常に null）
- `src/lib/dates.ts`, `src/lib/stats.ts` … 日付・集計の純粋ロジック（`__tests__/` にテスト）
- `src/lib/repo.ts` … 保存先の抽象化（`SupabaseRepo` / `LocalRepo`）
- `src/lib/supabase.ts` … Supabase クライアント
- `src/components/AppProvider.tsx` … ログイン状態と日記一覧をまとめて持つ Context
- `src/components/` … 画面（`DiaryHome`, `WriteEntry`, `EntryView`, `Settings`, `Login`, `ResetPassword`）
- `src/app/` … ルート（`/`, `/write`, `/entry?id=`, `/settings`, `/login`, `/reset-password`）
- `supabase/migrations/` … テーブル定義と RLS

## 技術

Next.js 16 (App Router, 静的書き出し) / React 19 / TypeScript / Tailwind CSS v4 / Supabase (Auth + Postgres) / next-themes / Vitest / Playwright
