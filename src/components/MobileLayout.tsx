import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, MessageCircle, Calendar, User } from "lucide-react";
import logo from "@/assets/rally-sport-logo.png";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/feedback", icon: MessageCircle, label: "Wellness" },
  { path: "/calendar", icon: Calendar, label: "Calendar" },
  { path: "/chat", icon: User, label: "Chat" },
];

const MobileLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === "/login") return <>{children}</>;

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-background relative">
      <div className="flex-1 overflow-y-auto pb-20">
        <header className="sticky top-0 z-40 bg-card border-b border-border">
          <div className="flex items-center justify-center py-2">
            <img
              src={logo}
              alt="Rally Sport"
              className="h-14 w-auto object-contain"
            />
          </div>
        </header>
        {children}
      </div>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border z-50">
        <div className="flex justify-around items-center py-2 px-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;
