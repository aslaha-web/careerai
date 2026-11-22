/**
 * Single source of truth for the feature copy on the public pages.
 * Flip `status` to "available" when a feature ships and its "Coming soon" badge disappears everywhere.
 */
export type FeatureStatus = "available" | "coming-soon";

export interface Feature {
  id: "resume-analyzer" | "skill-gap" | "job-roles" | "interview-prep" | "roadmap" | "dashboard";
  title: string;
  summary: string;
  points: string[];
  /** Honest caveat shown with the feature. */
  note?: string;
  /** Key into the icon map in src/components/marketing/feature-icons.ts (kept out of here so this file stays pure data). */
  icon: "scan" | "target" | "briefcase" | "messages" | "route" | "dashboard";
  status: FeatureStatus;
}

export const features: Feature[] = [
  {
    id: "resume-analyzer",
    title: "Resume Analyzer",
    summary: "Upload a PDF or DOCX resume and get a structured review you can act on.",
    points: [
      "Pulls out your skills, education, experience and projects",
      "Flags missing sections, weak wording and formatting problems",
      "Shows an estimated score as a clear visual",
      "Keeps every analysis so you can see your progress",
    ],
    note: "The score is an estimate. It is not a real ATS result and does not guarantee interviews.",
    icon: "scan",
    status: "coming-soon",
  },
  {
    id: "skill-gap",
    title: "Skill Gap Finder",
    summary: "Pick a target role and see exactly which skills stand between you and it.",
    points: [
      "Enter the skills you already have",
      "Compare them with what the role usually asks for",
      "See current versus required skills side by side",
      "Get concrete suggestions for what to learn first",
    ],
    icon: "target",
    status: "coming-soon",
  },
  {
    id: "job-roles",
    title: "Job Role Recommendations",
    summary: "Discover roles that fit your skills and interests, with the reasoning shown.",
    points: [
      "Each suggestion explains why it fits you",
      "See the skills each role requires",
      "Save the roles you want to come back to",
      "Clearly separated from real job listings",
    ],
    note: "These are AI-generated career suggestions. CareerAI does not show or verify live job openings.",
    icon: "briefcase",
    status: "coming-soon",
  },
  {
    id: "interview-prep",
    title: "Interview Preparation",
    summary: "Practise questions for your target role and get feedback on your answers.",
    points: [
      "Choose a role and a difficulty level",
      "Read guidance on what a strong answer covers",
      "Write your own answer and get feedback",
      "Review your past practice sessions",
    ],
    icon: "messages",
    status: "coming-soon",
  },
  {
    id: "roadmap",
    title: "Learning Roadmap",
    summary: "Turn a target career into a week-by-week plan you can actually follow.",
    points: [
      "Starts from your current skill level",
      "Breaks the plan into weekly goals and tasks",
      "Tick tasks off as you finish them",
      "Track your completion at a glance",
    ],
    icon: "route",
    status: "coming-soon",
  },
  {
    id: "dashboard",
    title: "Progress Dashboard",
    summary: "One place to see your scores, skills, roadmap and recent activity.",
    points: [
      "Resume score trend and analysis count",
      "Skills you are strengthening",
      "Roadmap completion",
      "Quick links into every tool",
    ],
    icon: "dashboard",
    status: "coming-soon",
  },
];
