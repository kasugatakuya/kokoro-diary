import type { Metadata } from "next";
import { Suspense } from "react";
import { EntryView } from "@/components/EntryView";
import { Spinner } from "@/components/ui";

export const metadata: Metadata = { title: "日記" };

export default function Page() {
  return (
    <Suspense fallback={<Spinner />}>
      <EntryView />
    </Suspense>
  );
}
