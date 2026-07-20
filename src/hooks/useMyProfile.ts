import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MyProfile {
  displayName: string | null;
  avatarUrl: string | null;
}

/**
 * Returns the current user's profile fields that render across the app
 * (sidebar, chat, etc.). Refreshes on:
 *  - initial mount
 *  - a `profile-updated` window event (dispatched after local edits)
 *  - realtime UPDATEs on the profiles row for this user
 */
export const useMyProfile = (): MyProfile => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MyProfile>({ displayName: null, avatarUrl: null });

  const load = useCallback(async () => {
    if (!user) {
      setProfile({ displayName: null, avatarUrl: null });
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();
    setProfile({
      displayName: data?.display_name ?? null,
      avatarUrl: data?.avatar_url ?? null,
    });
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener("profile-updated", handler);
    return () => window.removeEventListener("profile-updated", handler);
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          setProfile({
            displayName: payload.new?.display_name ?? null,
            avatarUrl: payload.new?.avatar_url ?? null,
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return profile;
};

export const notifyProfileUpdated = () => {
  window.dispatchEvent(new Event("profile-updated"));
};
