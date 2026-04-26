import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "coach" | "player" | "manager";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  teamId: string | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, role: AppRole, teamCode?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoleAndTeam = async (userId: string) => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .limit(1);

    if (roles && roles.length > 0) {
      setRole(roles[0].role as AppRole);
    }

    // Try to find team - coach owns it, player is a member
    const { data: ownedTeams } = await supabase
      .from("teams")
      .select("id")
      .eq("coach_id", userId)
      .limit(1);

    if (ownedTeams && ownedTeams.length > 0) {
      setTeamId(ownedTeams[0].id);
      return;
    }

    const { data: memberships } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .limit(1);

    if (memberships && memberships.length > 0) {
      setTeamId(memberships[0].team_id);
    }
  };

  useEffect(() => {
    console.log("[AuthProvider] mounting, setting up auth listener");
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("[AuthProvider] onAuthStateChange:", _event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchRoleAndTeam(session.user.id);
        } else {
          setRole(null);
          setTeamId(null);
        }
        setLoading(false);
      }
    );

    // Fallback: explicitly fetch the initial session in case onAuthStateChange
    // does not fire INITIAL_SESSION promptly.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log("[AuthProvider] getSession resolved:", !!session);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchRoleAndTeam(session.user.id);
      }
      setLoading(false);
    }).catch((err) => {
      console.error("[AuthProvider] getSession error:", err);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string, selectedRole: AppRole, teamCode?: string) => {

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;

    if (data.user) {
      await supabase.from("user_roles").insert({ user_id: data.user.id, role: selectedRole });

      if (selectedRole === "coach") {
        const { data: team } = await supabase
          .from("teams")
          .insert({ name: `${displayName}'s Team`, coach_id: data.user.id })
          .select("id")
          .single();
        if (team) setTeamId(team.id);
      } else if ((selectedRole === "player" || selectedRole === "manager") && teamCode) {
        const { data: team, error: teamError } = await supabase
          .from("teams")
          .select("id")
          .eq("code", teamCode)
          .single();
        if (teamError || !team) {
          throw new Error("Invalid team code. Please check with your coach.");
        }
        await supabase.from("team_members").insert({ team_id: team.id, user_id: data.user.id });
        setTeamId(team.id);
      }

      setRole(selectedRole);

      // Re-fetch to ensure state is consistent after all inserts are done
      await fetchRoleAndTeam(data.user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setTeamId(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, teamId, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
