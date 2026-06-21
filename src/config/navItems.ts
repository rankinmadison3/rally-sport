import {
  LayoutDashboard,
  MessageCircle,
  Calendar,
  User,
  ClipboardCheck,
  Sparkles,
  Trophy,
  LucideIcon,
} from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  desktopOnly?: boolean;
}

// Items shown in the mobile bottom nav
export const mobileNavItems: NavItem[] = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/feedback", icon: MessageCircle, label: "Feedback" },
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
  { path: "/reflections", icon: Sparkles, label: "Reflections" },
];

export const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  "/": { title: "Dashboard", subtitle: "Overview of your team" },
  "/feedback": { title: "Feedback", subtitle: "Create, send, and track team feedback" },
  "/tasks": { title: "Tasks", subtitle: "Assignments and progress" },
  "/calendar": { title: "Team Calendar", subtitle: "Games, practices and events" },
  "/chat": { title: "Chat", subtitle: "Team messaging" },
  "/reflections": { title: "Reflections", subtitle: "Personal check-ins and notes" },
  "/profile": { title: "Profile", subtitle: "Your account" },
};
