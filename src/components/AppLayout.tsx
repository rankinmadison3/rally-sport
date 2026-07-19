import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DesktopSidebar from "./DesktopSidebar";

import MobileBottomNav from "./MobileBottomNav";
import OrientationTutorial, { hasSeenOrientation, markOrientationSeen } from "./OrientationTutorial";
import logo from "@/assets/rally-sport-logo.png";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const { user, loading, role } = useAuth();
  const [tutorialOpen, setTutorialOpen] = useState(false);

  useEffect(() => {
    if (!loading && user && role && !hasSeenOrientation(user.id)) {
      const t = setTimeout(() => setTutorialOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, [loading, user, role]);

  // Allow any page (e.g. Profile) to trigger the shared tutorial.
  useEffect(() => {
    const handleReplay = () => setTutorialOpen(true);
    window.addEventListener("rally:replay-orientation" as any, handleReplay);
    return () => window.removeEventListener("rally:replay-orientation" as any, handleReplay);
  }, []);


  // Login page: render bare children (no shell)
  if (location.pathname === "/login") {
    return <>{children}</>;
  }

  // While auth loading or unauthenticated, render children without protected nav.
  // ProtectedRoute handles the redirect/loading UI itself.
  const showShell = !loading && !!user;

  if (!showShell) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <DesktopSidebar />

      {/* Mobile shell */}
      <div className="md:hidden flex flex-col min-h-screen max-w-md mx-auto bg-background relative">
        <div id="app-main-content" className="flex-1 overflow-y-auto pb-20">
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
        <MobileBottomNav />
      </div>

      {/* Desktop shell */}
      <div className="hidden md:block md:pl-60 min-h-screen">
        <main>
          <div className="w-full px-8 lg:px-12 py-10">
            {children}
          </div>
        </main>
      </div>
      <OrientationTutorial open={tutorialOpen} onOpenChange={setTutorialOpen} />
    </div>
  );

};

export default AppLayout;
