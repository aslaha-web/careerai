import { Briefcase, LayoutDashboard, MessagesSquare, Route, ScanText, Target, type LucideIcon } from "lucide-react";
import type { Feature } from "@/config/features";

export const featureIcons: Record<Feature["icon"], LucideIcon> = {
  scan: ScanText,
  target: Target,
  briefcase: Briefcase,
  messages: MessagesSquare,
  route: Route,
  dashboard: LayoutDashboard,
};
