import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Send, Shield, Loader2, ArrowLeft, Users, Check, CheckCheck, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  content: string;
  created_at: string;
  is_group: boolean;
  team_id: string | null;
  read_at: string | null;
}

interface MemberProfile {
  user_id: string;
  name: string;
  role: string;
}

type View = "list" | "group" | "dm";

const Chat = () => {
  const { user, teamId } = useAuth();
  const [view, setView] = useState<View>("list");
  const [activeDmUser, setActiveDmUser] = useState<MemberProfile | null>(null);

  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [profiles, setProfiles] = useState<Record<string, MemberProfile>>({});
  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([]);
  const [dmMessages, setDmMessages] = useState<ChatMessage[]>([]);
  const [allDms, setAllDms] = useState<ChatMessage[]>([]);
  const [groupLastRead, setGroupLastRead] = useState<string | null>(null);

  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  /* ---------- Members + profile lookup ---------- */
  useEffect(() => {
    if (!teamId) return;
    const load = async () => {
      const { data: tm } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", teamId);
      const ids = (tm ?? []).map((m) => m.user_id);
      if (ids.length === 0) {
        setMembers([]);
        setProfiles({});
        return;
      }
      const [{ data: profs }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name").in("user_id", ids),
        supabase.from("user_roles").select("user_id, role").in("user_id", ids),
      ]);
      const map: Record<string, MemberProfile> = {};
      (profs ?? []).forEach((p) => {
        const r = roles?.find((x) => x.user_id === p.user_id);
        map[p.user_id] = {
          user_id: p.user_id,
          name: p.display_name || "Unnamed",
          role: r?.role ?? "player",
        };
      });
      setProfiles(map);
      setMembers(Object.values(map).filter((m) => m.user_id !== user?.id));
    };
    load();
  }, [teamId, user?.id]);

  /* ---------- Group messages ---------- */
  const fetchGroup = useCallback(async () => {
    if (!teamId) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("id, sender_id, recipient_id, content, created_at, is_group, team_id, read_at")
      .eq("team_id", teamId)
      .eq("is_group", true)
      .order("created_at", { ascending: true })
      .limit(200);
    setGroupMessages((data as ChatMessage[]) ?? []);
  }, [teamId]);

  const fetchLastRead = useCallback(async () => {
    if (!teamId || !user) return;
    const { data } = await supabase
      .from("chat_last_read")
      .select("last_read_at")
      .eq("user_id", user.id)
      .eq("team_id", teamId)
      .maybeSingle();
    setGroupLastRead(data?.last_read_at ?? null);
  }, [teamId, user?.id]);

  /* ---------- All DMs (for inbox preview + active thread) ---------- */
  const fetchAllDms = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("id, sender_id, recipient_id, content, created_at, is_group, team_id, read_at")
      .eq("is_group", false)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: true })
      .limit(500);
    setAllDms((data as ChatMessage[]) ?? []);
  }, [user?.id]);

  useEffect(() => {
    fetchGroup();
    fetchLastRead();
    fetchAllDms();
  }, [fetchGroup, fetchLastRead, fetchAllDms]);

  /* ---------- Realtime ---------- */
  useEffect(() => {
    if (!user || !teamId) return;
    const channel = supabase
      .channel(`chat-${teamId}-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        (payload) => {
          const row = (payload.new ?? payload.old) as ChatMessage;
          if (!row) return;

          if (row.is_group && row.team_id === teamId) {
            if (payload.eventType === "INSERT") {
              setGroupMessages((prev) =>
                prev.some((m) => m.id === row.id) ? prev : [...prev, row]
              );
            } else if (payload.eventType === "UPDATE") {
              setGroupMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)));
            }
          } else if (!row.is_group && (row.sender_id === user.id || row.recipient_id === user.id)) {
            if (payload.eventType === "INSERT") {
              setAllDms((prev) =>
                prev.some((m) => m.id === row.id) ? prev : [...prev, row]
              );
            } else if (payload.eventType === "UPDATE") {
              setAllDms((prev) => prev.map((m) => (m.id === row.id ? row : m)));
            }
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, teamId]);

  /* ---------- Active DM thread ---------- */
  useEffect(() => {
    if (!activeDmUser || !user) {
      setDmMessages([]);
      return;
    }
    const thread = allDms
      .filter(
        (m) =>
          (m.sender_id === user.id && m.recipient_id === activeDmUser.user_id) ||
          (m.sender_id === activeDmUser.user_id && m.recipient_id === user.id)
      )
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    setDmMessages(thread);
  }, [activeDmUser, allDms, user?.id]);

  /* ---------- Mark read ---------- */
  // DM: mark all incoming unread DMs from active partner as read
  useEffect(() => {
    if (!activeDmUser || !user || view !== "dm") return;
    const unread = dmMessages.filter(
      (m) => m.recipient_id === user.id && m.sender_id === activeDmUser.user_id && !m.read_at
    );
    if (unread.length === 0) return;
    const ids = unread.map((m) => m.id);
    supabase
      .from("chat_messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids)
      .then(({ error }) => {
        if (error) console.error("mark read failed", error);
      });
  }, [activeDmUser?.user_id, user?.id, view, dmMessages]);

  // Group: bump last_read_at when entering group view
  useEffect(() => {
    if (view !== "group" || !user || !teamId) return;
    const now = new Date().toISOString();
    supabase
      .from("chat_last_read")
      .upsert(
        { user_id: user.id, team_id: teamId, last_read_at: now },
        { onConflict: "user_id,team_id" }
      )
      .then(({ error }) => {
        if (!error) setGroupLastRead(now);
      });
  }, [view, user?.id, teamId, groupMessages.length]);

  /* ---------- Scroll to bottom ---------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [view, groupMessages.length, dmMessages.length]);

  /* ---------- Sending ---------- */
  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content || !user || sending) return;
    if (view === "group" && !teamId) return;
    if (view === "dm" && !activeDmUser) return;

    setSending(true);
    const payload =
      view === "group"
        ? {
            sender_id: user.id,
            team_id: teamId!,
            is_group: true,
            content,
          }
        : {
            sender_id: user.id,
            team_id: teamId,
            is_group: false,
            recipient_id: activeDmUser!.user_id,
            content,
          };

    const { error } = await supabase.from("chat_messages").insert(payload);
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewMessage("");
  };

  /* ---------- Derived: DM inbox per partner ---------- */
  const dmInbox = useMemo(() => {
    if (!user) return [] as Array<{ partner: MemberProfile; last: ChatMessage; unread: number }>;
    const byPartner = new Map<string, ChatMessage[]>();
    allDms.forEach((m) => {
      const partnerId = m.sender_id === user.id ? m.recipient_id! : m.sender_id;
      if (!byPartner.has(partnerId)) byPartner.set(partnerId, []);
      byPartner.get(partnerId)!.push(m);
    });
    const rows: Array<{ partner: MemberProfile; last: ChatMessage; unread: number }> = [];
    byPartner.forEach((msgs, pid) => {
      const partner = profiles[pid];
      if (!partner) return;
      const sorted = msgs.sort((a, b) => a.created_at.localeCompare(b.created_at));
      const last = sorted[sorted.length - 1];
      const unread = sorted.filter(
        (m) => m.recipient_id === user.id && !m.read_at
      ).length;
      rows.push({ partner, last, unread });
    });
    return rows.sort((a, b) => b.last.created_at.localeCompare(a.last.created_at));
  }, [allDms, profiles, user?.id]);

  const groupUnread = useMemo(() => {
    if (!user) return 0;
    return groupMessages.filter(
      (m) => m.sender_id !== user.id && (!groupLastRead || m.created_at > groupLastRead)
    ).length;
  }, [groupMessages, groupLastRead, user?.id]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.name.toLowerCase().includes(q));
  }, [members, search]);

  /* ---------- Renderers ---------- */
  const renderMessage = (msg: ChatMessage, showSender = true) => {
    const isMe = msg.sender_id === user?.id;
    const profile = profiles[msg.sender_id] ?? { name: "Unknown", role: "player", user_id: msg.sender_id };
    return (
      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
            isMe ? "bg-primary text-primary-foreground" : "bg-card shadow-[var(--card-shadow)]"
          }`}
        >
          {!isMe && showSender && (
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-semibold text-card-foreground">{profile.name}</span>
              {(profile.role === "coach" || profile.role === "manager") && (
                <span className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold bg-primary text-primary-foreground uppercase">
                  <Shield className="w-2 h-2" /> {profile.role}
                </span>
              )}
            </div>
          )}
          <p className={`text-sm whitespace-pre-wrap break-words ${isMe ? "" : "text-card-foreground"}`}>
            {msg.content}
          </p>
          <div className={`flex items-center justify-end gap-1 mt-0.5 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            <span className="text-[10px]">
              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            {isMe && !msg.is_group && (
              msg.read_at
                ? <CheckCheck className="w-3 h-3" />
                : <Check className="w-3 h-3" />
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ---------- Header ---------- */
  const header = (
    <div className="flex items-center gap-3">
      {view !== "list" && (
        <button
          onClick={() => {
            setView("list");
            setActiveDmUser(null);
          }}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Messages</p>
        <h1 className="text-2xl font-bold font-display text-foreground truncate">
          {view === "list" && "Chat"}
          {view === "group" && "Team Chat"}
          {view === "dm" && (activeDmUser?.name ?? "Direct Message")}
        </h1>
      </div>
    </div>
  );

  /* ---------- Empty team state ---------- */
  if (!teamId) {
    return (
      <div className="p-4 space-y-4">
        {header}
        <div className="bg-card rounded-xl p-6 text-center text-sm text-muted-foreground shadow-[var(--card-shadow)]">
          Join or create a team to start chatting.
        </div>
      </div>
    );
  }

  /* ---------- LIST VIEW ---------- */
  if (view === "list") {
    return (
      <div className="p-4 space-y-4 pb-32">
        {header}

        {/* Group chat row */}
        <button
          onClick={() => setView("group")}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-card shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] transition-shadow text-left"
        >
          <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-card-foreground">Team Chat</p>
            <p className="text-xs text-muted-foreground truncate">
              {groupMessages.length === 0
                ? "No messages yet"
                : `${profiles[groupMessages[groupMessages.length - 1].sender_id]?.name ?? "Someone"}: ${
                    groupMessages[groupMessages.length - 1].content
                  }`}
            </p>
          </div>
          {groupUnread > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {groupUnread}
            </span>
          )}
        </button>

        {/* DM inbox */}
        {dmInbox.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Direct Messages</p>
            {dmInbox.map(({ partner, last, unread }) => (
              <button
                key={partner.user_id}
                onClick={() => {
                  setActiveDmUser(partner);
                  setView("dm");
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] transition-shadow text-left"
              >
                <div className="w-11 h-11 rounded-full bg-muted text-foreground flex items-center justify-center shrink-0 font-semibold">
                  {partner.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-card-foreground truncate">{partner.name}</p>
                    {(partner.role === "coach" || partner.role === "manager") && (
                      <Shield className="w-3 h-3 text-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {last.sender_id === user?.id ? "You: " : ""}
                    {last.content}
                  </p>
                </div>
                {unread > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                    {unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* New conversation: team member directory */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Team Members</p>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {filteredMembers.length === 0 && (
            <p className="text-xs text-muted-foreground px-1 py-4 text-center">
              {members.length === 0 ? "No teammates yet." : "No matches."}
            </p>
          )}
          {filteredMembers.map((m) => (
            <button
              key={m.user_id}
              onClick={() => {
                setActiveDmUser(m);
                setView("dm");
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-muted text-foreground flex items-center justify-center shrink-0 text-sm font-semibold">
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{m.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ---------- THREAD VIEW (group or DM) ---------- */
  const messages = view === "group" ? groupMessages : dmMessages;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-3rem)]">
      <div className="p-4 border-b border-border bg-background">
        {header}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">
            {view === "group" ? "No team messages yet. Start the conversation!" : "Say hi 👋"}
          </p>
        )}
        {messages.map((m) => renderMessage(m, view === "group"))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border bg-card p-3 sticky bottom-0">
        <div className="flex gap-2 items-end max-w-3xl mx-auto">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={view === "group" ? "Message the team…" : `Message ${activeDmUser?.name ?? ""}…`}
            rows={1}
            maxLength={1000}
            className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none max-h-32"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0 disabled:opacity-50 hover:opacity-90 transition-opacity"
            aria-label="Send"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
            ) : (
              <Send className="w-4 h-4 text-primary-foreground" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
