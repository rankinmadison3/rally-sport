import { NavLink } from "react-router-dom";
import { desktopNavItems } from "@/config/navItems";
import logo from "@/assets/rally-sport-logo.png";

const DesktopSidebar = () => {
  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col bg-card border-r border-border z-40">
      <div className="h-16 flex items-center px-5 border-b border-border">
        <img src={logo} alt="Rally Sport" className="h-10 w-auto object-contain" />
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {desktopNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
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
      <div className="p-4 text-xs text-muted-foreground border-t border-border">
        Rally Sport
      </div>
    </aside>
  );
};

export default DesktopSidebar;
