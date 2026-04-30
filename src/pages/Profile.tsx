import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User as UserIcon, Mail, Shield, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState<string>("Coach");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.display_name) setDisplayName(data.display_name);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const initial = (displayName || user?.email || "C").trim().charAt(0).toUpperCase();
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "Coach";

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-5">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account</p>
        <h1 className="text-2xl font-bold font-display text-foreground">Profile</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Avatar + name card */}
          <div className="bg-card rounded-2xl p-6 shadow-[var(--card-shadow)] flex flex-col items-center text-center gap-3">
            <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-4xl font-bold font-display shadow-md">
              {initial}
            </div>
            <div>
              <p className="text-xl font-bold font-display text-card-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground mt-1">{roleLabel}</p>
            </div>
          </div>

          {/* Detail rows */}
          <div className="bg-card rounded-2xl shadow-[var(--card-shadow)] divide-y divide-border overflow-hidden">
            <DetailRow icon={<UserIcon className="w-4 h-4 text-primary" />} label="Name" value={displayName} />
            <DetailRow icon={<Mail className="w-4 h-4 text-primary" />} label="Email" value={user?.email ?? "—"} />
            <DetailRow icon={<Shield className="w-4 h-4 text-primary" />} label="Role" value={roleLabel} />
          </div>

          {/* Log out */}
          <Button onClick={handleSignOut} variant="destructive" className="w-full">
            <LogOut className="w-4 h-4" /> Log out
          </Button>
        </>
      )}
    </div>
  );
};

const DetailRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3 px-4 py-3.5">
    <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className="text-sm font-medium text-card-foreground truncate">{value}</p>
    </div>
  </div>
);

export default Profile;
