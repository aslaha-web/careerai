import type { Metadata } from "next";
import { FeaturePlaceholder } from "@/components/layout/feature-placeholder";
import { mainNav, secondaryNav } from "@/config/nav";

export const metadata: Metadata = { title: "Analysis History" };

const item = [...mainNav, ...secondaryNav].find((i) => i.href === "/history")!;

export default function Page() {
  return <FeaturePlaceholder title={item.title} description={item.description} step={12} />;
}
