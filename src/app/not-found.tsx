import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <div className="text-4xl">🍃</div>
      <h1 className="mt-4 font-display text-xl font-bold">ページが見つかりません</h1>
      <Link href="/" className="mt-6 inline-flex rounded-full bg-accent px-5 py-2 text-sm font-bold text-white">
        日記へ戻る
      </Link>
    </div>
  );
}
