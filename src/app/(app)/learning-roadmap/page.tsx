import type { Metadata } from "next";
import { FeaturePlaceholder } from "@/components/layout/feature-placeholder";
import { mainNav, secondaryNav } from "@/config/nav";

export const metadata: Metadata = { title: "Learning Roadmap" };

const item = [...mainNav, ...secondaryNav].find((i) => i.href === "/learning-roadmap")!;

export default function Page() {
  return <FeaturePlaceholder title={item.title} description={item.description} step={11} />;
}
