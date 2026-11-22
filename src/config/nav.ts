import {
  Briefcase,
  History,
  LayoutDashboard,
  MessagesSquare,
  Route,
  ScanText,
  Target,
  UserCog,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** One-line description, reused by placeholder pages. */
  description: string;
}

export const mainNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Your career progress at a glance." },
  { title: "Resume Analyzer", href: "/resume-analyzer", icon: ScanText, description: "Upload a resume and get an AI-written review with an estimated ATS score." },
  { title: "Skill Gap Finder", href: "/skill-gap", icon: Target, description: "Compare your skills with the skills a target role asks for." },
  { title: "Job Recommendations", href: "/job-recommendations", icon: Briefcase, description: "Career paths that fit your skills, with the reasons why." },
  { title: "Interview Prep", href: "/interview-prep", icon: MessagesSquare, description: "Practice role-specific questions and get feedback on your answers." },
  { title: "Learning Roadmap", href: "/learning-roadmap", icon: Route, description: "A week-by-week plan to reach your target role." },
  { title: "Analysis History", href: "/history", icon: History, description: "Every analysis and practice session you have saved." },
];

export const secondaryNav: NavItem[] = [
  { title: "Profile Settings", href: "/settings", icon: UserCog, description: "Manage your profile and preferences." },
];

const allNav = [...mainNav, ...secondaryNav];

export function getNavTitle(pathname: string): string {
  const match = allNav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return match?.title ?? "CareerAI";
}
