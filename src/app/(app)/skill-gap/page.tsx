import type { Metadata } from "next";
import { FeaturePlaceholder } from "@/components/layout/feature-placeholder";
import { mainNav, secondaryNav } from "@/config/nav";

export const metadata: Metadata = { title: "Skill Gap Finder" };

const item = [...mainNav, ...secondaryNav].find((i) => i.href === "/skill-gap")!;

export default function Page() {
  return <FeaturePlaceholder title={item.title} description={item.description} step={8} />;
}
