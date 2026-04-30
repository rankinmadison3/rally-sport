import { supabase } from "@/integrations/supabase/client";

export interface ChatMessageRow {
  id: string;
  team_id: string;
  sender_id: string;
  recipient_id: string | null;
  conversation_id: string | null;
  content: string;
  message_type: string;
  is_group: boolean;
  is_deleted: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMemberRow {
  user_id: string;
  display_name: string;
  role: string;
  joined_at: string | null;
  avatar_url: string | null;
}

const MESSAGE_COLUMNS =
  "id, team_id, sender_id, recipient_id, conversation_id, content, message_type, is_group, is_deleted, edited_at, created_at, updated_at";

/* ---------- Members ---------- */
export const getTeamMembers = async (teamId: string): Promise<TeamMemberRow[]> => {
  // 1. Get user IDs in this team (plus the coach, who may not be in team_members)
  const [{ data: tm, error: tmErr }, { data: team, error: teamErr }] = await Promise.all([
    supabase.from("team_members").select("user_id, joined_at").eq("team_id", teamId),
    supabase.from("teams").select("coach_id").eq("id", teamId).maybeSingle(),
  ]);
  if (tmErr) throw tmErr;
  if (teamErr) throw teamErr;

  const joinedMap = new Map<string, string | null>();
  (tm ?? []).forEach((m) => joinedMap.set(m.user_id, m.joined_at));
  if (team?.coach_id && !joinedMap.has(team.coach_id)) {
    joinedMap.set(team.coach_id, null);
  }

  const ids = Array.from(joinedMap.keys());
  if (ids.length === 0) return [];

  // 2. Fetch profiles + roles only for these members
  const [{ data: profs }, { data: roles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", ids),
    supabase.from("user_roles").select("user_id, role").in("user_id", ids),
  ]);

  return ids.map((uid) => {
    const p = profs?.find((x) => x.user_id === uid);
    const r = roles?.find((x) => x.user_id === uid);
    return {
      user_id: uid,
      display_name: p?.display_name || "Unnamed",
      role: r?.role ?? "player",
      joined_at: joinedMap.get(uid) ?? null,
      avatar_url: p?.avatar_url ?? null,
    };
  });
};

/* ---------- Messages ---------- */
export const getGroupMessages = async (teamId: string, limit = 200): Promise<ChatMessageRow[]> => {
  const { data, error } = await supabase
    .from("chat_messages")
    .select(MESSAGE_COLUMNS)
    .eq("team_id", teamId)
    .eq("is_group", true)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data as ChatMessageRow[]) ?? [];
};

export const getDirectMessages = async (
  teamId: string,
  currentUserId: string,
  recipientId: string,
  limit = 200
): Promise<ChatMessageRow[]> => {
  const { data, error } = await supabase
    .from("chat_messages")
    .select(MESSAGE_COLUMNS)
    .eq("team_id", teamId)
    .eq("is_group", false)
    .or(
      `and(sender_id.eq.${currentUserId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${currentUserId})`
    )
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data as ChatMessageRow[]) ?? [];
};

export const getAllDirectMessagesForUser = async (
  teamId: string,
  currentUserId: string,
  limit = 500
): Promise<ChatMessageRow[]> => {
  const { data, error } = await supabase
    .from("chat_messages")
    .select(MESSAGE_COLUMNS)
    .eq("team_id", teamId)
    .eq("is_group", false)
    .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data as ChatMessageRow[]) ?? [];
};

/* ---------- Sending ---------- */
export const sendGroupMessage = async (teamId: string, senderId: string, content: string) => {
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Message is empty");
  const { error } = await supabase.from("chat_messages").insert({
    team_id: teamId,
    sender_id: senderId,
    recipient_id: null,
    is_group: true,
    content: trimmed,
  });
  if (error) throw error;
};

export const sendDirectMessage = async (
  teamId: string,
  senderId: string,
  recipientId: string,
  content: string
) => {
  if (senderId === recipientId) throw new Error("Cannot message yourself");
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Message is empty");
  const { error } = await supabase.from("chat_messages").insert({
    team_id: teamId,
    sender_id: senderId,
    recipient_id: recipientId,
    is_group: false,
    content: trimmed,
  });
  if (error) throw error;
};

/* ---------- Read receipts ---------- */
export const markMessagesAsRead = async (messageIds: string[], userId: string) => {
  if (messageIds.length === 0) return;
  const rows = messageIds.map((message_id) => ({ message_id, user_id: userId }));
  const { error } = await supabase
    .from("chat_message_reads")
    .upsert(rows, { onConflict: "message_id,user_id", ignoreDuplicates: true });
  if (error) throw error;
};

export const getUserReadMessageIds = async (
  userId: string,
  messageIds: string[]
): Promise<Set<string>> => {
  if (messageIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from("chat_message_reads")
    .select("message_id")
    .eq("user_id", userId)
    .in("message_id", messageIds);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.message_id));
};

/* ---------- Edit / delete ---------- */
export const editMessage = async (messageId: string, content: string) => {
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Message is empty");
  const { error } = await supabase
    .from("chat_messages")
    .update({ content: trimmed, edited_at: new Date().toISOString() })
    .eq("id", messageId);
  if (error) throw error;
};

export const softDeleteMessage = async (messageId: string) => {
  const { error } = await supabase
    .from("chat_messages")
    .update({ is_deleted: true, content: "" })
    .eq("id", messageId);
  if (error) throw error;
};
