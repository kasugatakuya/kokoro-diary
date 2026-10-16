import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card } from "@/components/ui";

export const metadata: Metadata = { title: "この日記について", alternates: { canonical: "/about" } };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <div className="text-4xl">🕊️</div>
        <h1 className="mt-3 font-display text-2xl font-bold">この日記について</h1>
        <p className="mt-2 text-sm text-muted">なぜ、このアプリを作ったのか。</p>
      </div>

      <Card className="prose-diary space-y-6 text-[15px]">
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold">書くと、楽になる</h2>
          <p>
            そのとき思った気持ちや思いを、そのまま文章にすると、すっと楽になります。
            <br className="hidden sm:block" />
            けれど紙に書くと、あとで捨ててしまう。そのときだけ書いて、習慣にはならない。楽になるのも、そのときだけでした。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold">「日記」という使命感が、書けなくする</h2>
          <p>
            いざ日記を書こうとすると、「その日の出来事を書かなければ」という使命感に支配されて、自由に書けなくなります。
            <br className="hidden sm:block" />
            そうすると、自然と書かなくなってしまう。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold">自分を楽にしてあげるために</h2>
          <p>
            私はとにかく、自分を楽にしてあげるためにこのアプリを作りました。
            <br className="hidden sm:block" />
            思ったこと、感じたことがあれば、なんでも書いていいアプリです。
          </p>
          <p>
            書いたことを忘れないように保存しておく。それだけの機能です。
            <br className="hidden sm:block" />
            気持ちは一日のうちに何度も変わるから、1 日に何件でも書けるようにして、いつ書いたかだけ分かるようにしてあります。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold">書かなかった日は、穏やかだった日</h2>
          <p>
            日記を書かなかった日は、あなたの心が穏やかだった証拠です。
            <br className="hidden sm:block" />
            だって、思いを書く必要がなかったのだから。
          </p>
          <p>
            だから、書けなかったことを気にしなくていい。続いていなくても、それでいいのです。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold">公開はしません</h2>
          <p>
            だって、目的は自分が楽になることだから。
            <br className="hidden sm:block" />
            ここに書いたものは、あなた以外の誰にも見えません。
          </p>
        </section>

        <section className="rounded-2xl bg-accent-soft px-5 py-4">
          <p className="font-display text-base font-bold">
            「日記」なんていう使命感にとらわれずに、
            <br className="hidden sm:block" />
            とにかく、書きたいことを書いてください。
          </p>
        </section>
      </Card>

      <div className="text-center">
        <Link href="/write">
          <Button variant="primary" size="lg">
            ✍️ いまの気持ちを書く
          </Button>
        </Link>
      </div>
    </div>
  );
}
