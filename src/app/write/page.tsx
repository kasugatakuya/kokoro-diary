import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import { WriteEntry } from "@/components/WriteEntry";

export const metadata: Metadata = { title: "書く", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={<Spinner />}>
      <WriteEntry />
    </Suspense>
  );
}
