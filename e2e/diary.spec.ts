import { expect, test } from "@playwright/test";

test.describe("ローカルモードの日記", () => {
  test("書いて、読んで、直して、削除できる", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("どんな気持ち");
    await expect(page.getByText("まだ日記はありません")).toBeVisible();

    await page.getByRole("link", { name: /書く/ }).first().click();
    await expect(page).toHaveURL(/\/write/);
    await page.getByLabel("タイトル").fill("はじめての日記");
    await page.getByLabel("本文").fill("今日は少しだけ散歩をした。\n風が気持ちよかった。");
    await page.getByRole("button", { name: "しまっておく" }).click();

    await expect(page).toHaveURL(/\/entry\?id=/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("はじめての日記");
    await expect(page.getByText("風が気持ちよかった。")).toBeVisible();

    await page.getByRole("link", { name: "直す" }).click();
    await expect(page.getByLabel("本文")).toHaveValue(/散歩をした/);
    await page.getByLabel("本文").fill("書き直した本文。");
    await page.getByRole("button", { name: "保存する" }).click();
    await expect(page.getByText("書き直した本文。")).toBeVisible();

    await page.goto("/");
    await expect(page.getByText("はじめての日記")).toBeVisible();
    await expect(page.getByText("今日は 1 件書きました")).toBeVisible();
    await page.getByRole("link", { name: /はじめての日記/ }).click();

    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "削除" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("まだ日記はありません")).toBeVisible();
  });

  test("同じ日に何件でも書ける", async ({ page }) => {
    for (const text of ["朝: ねむい", "昼: おなかがすいた", "夜: 今日はよくがんばった"]) {
      await page.goto("/write");
      await page.getByLabel("本文").fill(text);
      await page.getByRole("button", { name: "しまっておく" }).click();
      await expect(page).toHaveURL(/\/entry\?id=/);
    }
    await expect(page.getByText("この日 3 件")).toBeVisible();
    await page.getByRole("link", { name: "この日にもうひとつ書く" }).click();
    await expect(page).toHaveURL(/\/write\?date=\d{4}-\d{2}-\d{2}/);

    await page.goto("/");
    await expect(page.getByText("今日は 3 件書きました")).toBeVisible();
    await expect(page.getByRole("link", { name: "もうひとつ書く" })).toBeVisible();
    for (const text of ["朝: ねむい", "昼: おなかがすいた", "夜: 今日はよくがんばった"]) {
      await expect(page.getByText(text)).toBeVisible();
    }
    await expect(page.getByRole("button", { name: /3件$/ })).toBeVisible();

    // 4 件目を書いても、同じ日の分は畳まれず全部並ぶ（最新が上）
    await page.goto("/write");
    await page.getByLabel("本文").fill("深夜: まだ起きている");
    await page.getByRole("button", { name: "しまっておく" }).click();
    await expect(page).toHaveURL(/\/entry\?id=/);
    await page.goto("/");
    await expect(page.getByText("今日は 4 件書きました")).toBeVisible();
    await expect(page.getByText("深夜: まだ起きている")).toBeVisible();
    await expect(page.getByText("朝: ねむい")).toBeVisible();
    await expect(page.getByRole("button", { name: /もっと見る/ })).toHaveCount(0);
  });

  test("下書きは自動保存され、再訪時に復元される", async ({ page }) => {
    await page.goto("/write");
    await page.getByLabel("本文").fill("途中まで書いた");
    await page.waitForTimeout(700);
    await page.goto("/");
    await page.goto("/write");
    await expect(page.getByText("下書きを復元しました")).toBeVisible();
    await expect(page.getByLabel("本文")).toHaveValue("途中まで書いた");
    await page.getByRole("button", { name: "破棄する" }).click();
    await expect(page.getByLabel("本文")).toHaveValue("");
  });

  test("検索とカレンダーの絞り込みが効く", async ({ page }) => {
    await page.goto("/write");
    await page.getByLabel("本文").fill("ケーキを食べた");
    await page.getByRole("button", { name: "しまっておく" }).click();
    await expect(page).toHaveURL(/\/entry/);
    await page.goto("/write");
    await page.getByLabel("本文").fill("頭が痛い");
    await page.getByRole("button", { name: "しまっておく" }).click();
    await expect(page).toHaveURL(/\/entry/);

    await page.goto("/");
    await page.getByLabel("検索").fill("ケーキ");
    await expect(page.getByText("ケーキを食べた")).toBeVisible();
    await expect(page.getByText("頭が痛い")).toHaveCount(0);
    await page.getByRole("button", { name: "絞り込みを解除" }).click();
    await expect(page.getByText("頭が痛い")).toBeVisible();
    await expect(page.getByText("ケーキを食べた")).toBeVisible();
    // カレンダーで今日を選ぶと、その日の日記だけになる
    await page.getByRole("button", { name: /2件$/ }).click();
    await expect(page.getByText(/の日記$/)).toBeVisible();
    await expect(page.getByText("頭が痛い")).toBeVisible();
    await page.getByRole("button", { name: /2件$/ }).click();
    await expect(page.getByText(/の日記$/)).toHaveCount(0);
  });

  test("設定ページで書き出しとテーマ切替ができる", async ({ page }) => {
    await page.goto("/write");
    await page.getByLabel("本文").fill("書き出しテスト");
    await page.getByRole("button", { name: "しまっておく" }).click();
    await expect(page).toHaveURL(/\/entry/);
    await page.goto("/settings");
    const dl = page.waitForEvent("download");
    await page.getByRole("button", { name: "Markdown で保存" }).click();
    expect((await dl).suggestedFilename()).toMatch(/^kokoro-diary-\d{4}-\d{2}-\d{2}\.md$/);
    await page.getByRole("button", { name: "ダーク", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("カテゴリを作って、分けて、絞り込める", async ({ page }) => {
    // 設定で候補から「詩」を追加し、自分で「歌詞」を作る
    await page.goto("/settings");
    await page.getByRole("button", { name: "＋ 詩" }).click();
    await page.getByLabel("新しいカテゴリ名").fill("歌詞");
    await page.getByRole("radio", { name: "色: amber" }).first().click();
    await page.getByRole("button", { name: "追加", exact: true }).click();
    await expect(page.locator("li", { hasText: "歌詞" })).toBeVisible();
    await expect(page.getByText("同じ名前のカテゴリがあります")).toHaveCount(0);

    // 書く画面で「詩」を選んで保存
    await page.goto("/write");
    await page.getByRole("radio", { name: "詩" }).click();
    await page.getByLabel("本文").fill("月の光が\n窓にとまる");
    await page.getByRole("button", { name: "しまっておく" }).click();
    await expect(page).toHaveURL(/\/entry/);
    await expect(page.getByText("詩", { exact: true })).toBeVisible();

    // 書く画面でその場でカテゴリを追加
    await page.goto("/write");
    await page.getByRole("button", { name: "＋ 新しいカテゴリ" }).click();
    await page.getByLabel("新しいカテゴリ名").fill("ひとりごと");
    await page.getByRole("button", { name: "追加", exact: true }).click();
    await expect(page.getByRole("radio", { name: "ひとりごと" })).toHaveAttribute("aria-checked", "true");
    await page.getByLabel("本文").fill("ねむい");
    await page.getByRole("button", { name: "しまっておく" }).click();
    await expect(page).toHaveURL(/\/entry/);

    // 一覧でカテゴリ絞り込み
    await page.goto("/");
    await page.getByRole("group", { name: "カテゴリで絞り込む" }).getByRole("button", { name: "詩" }).click();
    await expect(page.getByText("月の光が")).toBeVisible();
    await expect(page.getByText("ねむい")).toHaveCount(0);

    // カテゴリを削除しても日記は残る
    await page.goto("/settings");
    page.once("dialog", (d) => d.accept());
    await page.locator("li", { hasText: "詩" }).getByRole("button", { name: "削除" }).click();
    await expect(page.locator("li", { hasText: "詩" })).toHaveCount(0);
    await page.goto("/");
    await expect(page.getByText("月の光が")).toBeVisible();
  });

  test("星を押すとお気に入りになり、絞り込める", async ({ page }) => {
    for (const text of ["大切にしたいことば", "ふつうの一日"]) {
      await page.goto("/write");
      await page.getByLabel("本文").fill(text);
      await page.getByRole("button", { name: "しまっておく" }).click();
      await expect(page).toHaveURL(/\/entry\?id=/);
    }
    // 読む画面の星で登録（いま開いているのは「ふつうの一日」）
    await page.getByRole("button", { name: "お気に入りに登録" }).click();
    await expect(page.getByText("★ お気に入り")).toBeVisible();
    await page.getByRole("button", { name: "お気に入りから外す" }).click();
    await expect(page.getByText("★ お気に入り")).toHaveCount(0);

    // 一覧の星で「大切にしたいことば」を登録し、絞り込む
    await page.goto("/");
    await expect(page.getByRole("button", { name: "お気に入りに登録" })).toHaveCount(2);
    await page.locator("li", { hasText: "大切にしたいことば" }).getByRole("button", { name: "お気に入りに登録" }).click();
    await expect(page.getByRole("button", { name: "お気に入りから外す" })).toHaveCount(1);
    await page.getByRole("button", { name: "お気に入りだけ表示" }).click();
    await expect(page.getByText("大切にしたいことば")).toBeVisible();
    await expect(page.getByText("ふつうの一日")).toHaveCount(0);

    await page.getByRole("button", { name: "絞り込みを解除" }).click();
    await expect(page.getByText("ふつうの一日")).toBeVisible();

    // リロードしてもお気に入りは残っている
    await page.reload();
    await expect(page.getByRole("button", { name: "お気に入りから外す" })).toHaveCount(1);
    await expect(page.locator("li", { hasText: "大切にしたいことば" }).getByRole("button", { name: "お気に入りから外す" })).toBeVisible();
  });

  test("11 件以上になるとページ送りになる", async ({ page }) => {
    // localStorage に 11 件を直接入れておく（新しい順に並ぶよう、日付をずらす）
    await page.addInitScript(() => {
      if (localStorage.getItem("kokoro-diary:entries")) return;
      const entries = Array.from({ length: 11 }, (_, i) => {
        const d = new Date(2026, 0, 1 + i);
        const entryDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const createdAt = `${entryDate}T09:00:00.000Z`;
        return { id: `seed-${i + 1}`, entryDate, title: "", body: `日記 ${i + 1} 番目`, mood: null, categoryId: null, favorite: false, createdAt, updatedAt: createdAt };
      });
      localStorage.setItem("kokoro-diary:entries", JSON.stringify(entries));
    });
    await page.goto("/");
    await expect(page.getByText("全 11 件中 1〜10 件")).toBeVisible();
    await expect(page.getByText("日記 11 番目")).toBeVisible(); // 最新が先頭
    await expect(page.getByText("日記 2 番目", { exact: true })).toBeVisible();
    await expect(page.getByText("日記 1 番目", { exact: true })).toHaveCount(0); // いちばん古い 1 件は 2 ページ目
    await expect(page.getByRole("button", { name: "前のページ" })).toBeDisabled();

    await page.getByRole("button", { name: "次のページ" }).click();
    await expect(page.getByText("全 11 件中 11〜11 件")).toBeVisible();
    await expect(page.getByText("日記 1 番目", { exact: true })).toBeVisible();
    await expect(page.getByText("日記 11 番目")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "次のページ" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "2ページ目" })).toHaveAttribute("aria-current", "page");

    // 絞り込むと 1 ページ目に戻り、10 件以下ならページ送りは消える
    await page.getByLabel("検索").fill("1 番目");
    await expect(page.getByText("日記 1 番目", { exact: true })).toBeVisible();
    await expect(page.getByText("日記 11 番目")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "ページ送り" })).toHaveCount(0);
    await page.getByRole("button", { name: "絞り込みを解除" }).click();
    await expect(page.getByText("全 11 件中 1〜10 件")).toBeVisible();
    await page.getByRole("button", { name: "1ページ目" }).click();
    await expect(page.getByText("日記 11 番目")).toBeVisible();
  });

  test("「この日記について」のページが読める", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /思い/ }).first().click();
    await expect(page).toHaveURL(/\/about/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("この日記について");
    await expect(page.getByRole("heading", { name: "自分を楽にしてあげるために" })).toBeVisible();
    await page.getByRole("link", { name: "いまの気持ちを書く" }).click();
    await expect(page).toHaveURL(/\/write/);
  });

  test("横スクロールが発生しない", async ({ page }) => {
    for (const path of ["/", "/write", "/settings", "/login", "/about"]) {
      await page.goto(path);
      const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
      expect(sw, path).toBeLessThanOrEqual(iw);
    }
  });
});
