/**
 * 公開 URL（末尾スラッシュなし）。サイトマップ・robots.txt・canonical に使う。
 * 優先順位: NEXT_PUBLIC_SITE_URL → Vercel の本番ドメイン → Cloudflare Pages → 仮ドメイン
 */
const PLACEHOLDER = "https://kokoro-diary.example.com";

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  const cf = process.env.CF_PAGES_URL;
  if (cf) return cf;
  if (process.env.NODE_ENV === "production") {
    console.warn(`[kokoro-diary] 公開 URL が未設定のため、サイトマップに仮ドメイン ${PLACEHOLDER} を使います。NEXT_PUBLIC_SITE_URL を設定してください。`);
  }
  return PLACEHOLDER;
}

export const SITE_URL = resolveSiteUrl().replace(/\/+$/, "");

/** 検索に載せてよいページ（ログイン前に見える公開ページだけ） */
export const PUBLIC_PAGES = ["/", "/about", "/login"] as const;

/** 本人専用のページ。検索対象にしない */
export const PRIVATE_PAGES = ["/write", "/entry", "/settings", "/reset-password"] as const;
