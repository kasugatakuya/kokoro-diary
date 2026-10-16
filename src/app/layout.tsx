import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Zen_Maru_Gothic } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";
import { Shell } from "@/components/Shell";

const body = Noto_Sans_JP({ variable: "--font-body", subsets: ["latin"], preload: false });
const display = Zen_Maru_Gothic({ variable: "--font-display", weight: ["500", "700"], subsets: ["latin"], preload: false });

export const metadata: Metadata = {
  title: { default: "心 日記", template: "%s | 心 日記" },
  description: "心の中で思ったことを、なんでも書いてしまっておく場所。自分だけの日記です。",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1816" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" suppressHydrationWarning className={`${body.variable} ${display.variable} h-full`}>
      <body className="min-h-full">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AppProvider>
            <Shell>{children}</Shell>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
