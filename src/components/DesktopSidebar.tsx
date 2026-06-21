import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { desktopNavItems } from "@/config/navItems";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/rally-sport-logo.png";

const DesktopSidebar = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const initial = user?.email?.charAt(0).toUpperCase() ?? "?";
  const isStaff = role === "coach" || role === "manager";
  const navItems = desktopNavItems.filter((item) => !item.staffOnly || isStaff);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
      return;
    }
    navigate("/login");
  };

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col bg-card border-r border-border z-40">
      <div className="h-16 flex items-center px-5 border-b border-border">
        <img src={logo} alt="Rally Sport" className="h-10 w-auto object-contain" />
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            data-tour={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-border space-y-1">
        <NavLink
          to="/profile"
          data-tour="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`
          }
        >
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">Profile</p>
            {user?.email && (
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            )}
          </div>
        </NavLink>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
