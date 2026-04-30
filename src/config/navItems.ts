import {
  LayoutDashboard,
  MessageCircle,
  Calendar,
  User,
  ClipboardCheck,
  FileText,
  LucideIcon,
} from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  desktopOnly?: boolean;
}

// Items shown in the mobile bottom nav (kept identical to previous behavior)
export const mobileNavItems: NavItem[] = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/feedback", icon: MessageCircle, label: "Wellness" },
  { path: "/calendar", icon: Calendar, label: "Calendar" },
  { path: "/chat", icon: User, label: "Chat" },
];

// Full nav for the desktop sidebar
export const desktopNavItems: NavItem[] = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/feedback", icon: MessageCircle, label: "Feedback" },
  { path: "/tasks", icon: ClipboardCheck, label: "Tasks" },
  { path: "/calendar", icon: Calendar, label: "Calendar" },
  { path: "/chat", icon: User, label: "Chat" },
  { path: "/feedback-form", icon: FileText, label: "Feedback Form" },
];

export const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  "/": { title: "Dashboard", subtitle: "Overview of your team" },
  "/feedback": { title: "Feedback", subtitle: "Team responses & insights" },
  "/tasks": { title: "Tasks", subtitle: "Assignments and progress" },
  "/calendar": { title: "Team Calendar", subtitle: "Games, practices and events" },
  "/chat": { title: "Chat", subtitle: "Team messaging" },
  "/feedback-form": { title: "Feedback Form", subtitle: "Submit your responses" },
};
