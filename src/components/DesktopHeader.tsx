import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { pageTitles } from "@/config/navItems";

const DesktopHeader = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const meta = pageTitles[pathname] ?? { title: "" };
  const initial = user?.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <header className="hidden md:flex sticky top-0 z-30 h-16 items-center justify-between px-8 border-b border-border bg-background/80 backdrop-blur-md">
      <div>
        <h1 className="text-lg font-display font-semibold text-foreground leading-tight">
          {meta.title}
        </h1>
        {meta.subtitle && (
          <p className="text-xs text-muted-foreground">{meta.subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {user?.email && (
          <span className="text-sm text-muted-foreground hidden lg:inline">
            {user.email}
          </span>
        )}
        <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
          {initial}
        </div>
      </div>
    </header>
  );
};

export default DesktopHeader;
