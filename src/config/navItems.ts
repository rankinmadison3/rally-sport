import {
  LayoutDashboard,
  MessageCircle,
  Calendar,
  User,
  ClipboardCheck,
  Sparkles,
  Trophy,
  Inbox,
  LucideIcon,
} from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  desktopOnly?: boolean;
  staffOnly?: boolean;
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
  { path: "/inbox", icon: Inbox, label: "Feedback Inbox", staffOnly: true },
  { path: "/tasks", icon: ClipboardCheck, label: "Tasks" },
  { path: "/calendar", icon: Calendar, label: "Calendar" },
  { path: "/season", icon: Trophy, label: "Season Record", staffOnly: true },
  { path: "/chat", icon: User, label: "Chat" },
  { path: "/reflections", icon: Sparkles, label: "Reflections" },
];

export const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  "/": { title: "Dashboard", subtitle: "Overview of your team" },
  "/feedback": { title: "Feedback", subtitle: "Create, send, and track team feedback" },
  "/inbox": { title: "Feedback Inbox", subtitle: "Player comments and reflections" },
  "/tasks": { title: "Tasks", subtitle: "Assignments and progress" },
  "/calendar": { title: "Team Calendar", subtitle: "Games, practices and events" },
  "/season": { title: "Season Record", subtitle: "Log wins and losses" },
  "/chat": { title: "Chat", subtitle: "Team messaging" },
  "/reflections": { title: "Reflections", subtitle: "Personal check-ins and notes" },
  "/profile": { title: "Profile", subtitle: "Your account" },
};
