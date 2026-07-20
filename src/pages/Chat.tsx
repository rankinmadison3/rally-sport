import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Send, Shield, Loader2, ArrowLeft, Users, Check, CheckCheck, Search,
  MoreVertical, Pencil, Trash2, X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ChatMessageRow, TeamMemberRow,
  getTeamMembers, getGroupMessages, getAllDirectMessagesForUser,
  sendGroupMessage, sendDirectMessage,
  markMessagesAsRead, getUserReadMessageIds,
  editMessage, softDeleteMessage,
} from "@/services/chatService";

type Mode = "group" | "direct";

const Chat = () => {
  const { user, teamId, role } = useAuth();

  /* ---------- state ---------- */
  const [activeMode, setActiveMode] = useState<Mode>("group");
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [mobileShowList, setMobileShowList] = useState(true); // mobile: list vs thread

  const [teamMembers, setTeamMembers] = useState<TeamMemberRow[]>([]);
  const [groupMessages, setGroupMessages] = useState<ChatMessageRow[]>([]);
  const [directMessages, setDirectMessages] = useState<ChatMessageRow[]>([]);
  const [readSet, setReadSet] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [outgoingReadSet, setOutgoingReadSet] = useState<Set<string>>(new Set());

  const bottomRef = useRef<HTMLDivElement>(null);

  const memberMap = useMemo(() => {
    const m = new Map<string, TeamMemberRow>();
    teamMembers.forEach((tm) => m.set(tm.user_id, tm));
    return m;
  }, [teamMembers]);

  const otherMembers = useMemo(
    () => teamMembers.filter((m) => m.user_id !== user?.id),
    [teamMembers, user?.id]
  );

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return otherMembers;
    return otherMembers.filter((m) => m.display_name.toLowerCase().includes(q));
  }, [otherMembers, search]);

  /* ---------- initial load ---------- */
  useEffect(() => {
    if (!teamId || !user) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [members, groups, dms] = await Promise.all([
          getTeamMembers(teamId),
          getGroupMessages(teamId),
          getAllDirectMessagesForUser(teamId, user.id),
        ]);
        if (cancelled) return;
        setTeamMembers(members);
        setGroupMessages(groups);
        setDirectMessages(dms);

        // Read receipts: incoming (for unread/clearing) + outgoing DM ids (for ✓✓)
        const incomingIds = [
          ...groups.filter((m) => m.sender_id !== user.id).map((m) => m.id),
          ...dms.filter((m) => m.recipient_id === user.id).map((m) => m.id),
        ];
        const outgoingDmIds = dms.filter((m) => m.sender_id === user.id).map((m) => m.id);
        const [reads, outgoing] = await Promise.all([
          getUserReadMessageIds(user.id, incomingIds),
          outgoingDmIds.length === 0
            ? Promise.resolve([] as { message_id: string }[])
            : supabase
                .from("chat_message_reads")
                .select("message_id")
                .in("message_id", outgoingDmIds)
                .then((r) => r.data ?? []),
        ]);
        if (!cancelled) {
          setReadSet(reads);
          setOutgoingReadSet(new Set(outgoing.map((r) => r.message_id)));
        }
      } catch (err: any) {
        console.error(err);
        toast.error("Could not load messages.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [teamId, user?.id]);

  /* ---------- realtime ---------- */
  useEffect(() => {
    if (!teamId || !user) return;

    const groupChannel = supabase
      .channel(`team-group-chat-${teamId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "chat_messages", filter: `team_id=eq.${teamId}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as ChatMessageRow;
          if (!row || !row.is_group) return;
          if (payload.eventType === "INSERT") {
            setGroupMessages((prev) =>
              prev.some((m) => m.id === row.id) ? prev : [...prev, row]
            );
          } else if (payload.eventType === "UPDATE") {
            setGroupMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)));
          } else if (payload.eventType === "DELETE") {
            setGroupMessages((prev) => prev.filter((m) => m.id !== row.id));
          }
        }
      )
      .subscribe();

    const dmChannel = supabase
      .channel(`team-direct-chat-${teamId}-${user.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "chat_messages", filter: `team_id=eq.${teamId}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as ChatMessageRow;
          if (!row || row.is_group) return;
          if (row.sender_id !== user.id && row.recipient_id !== user.id) return;
          if (payload.eventType === "INSERT") {
            setDirectMessages((prev) =>
              prev.some((m) => m.id === row.id) ? prev : [...prev, row]
            );
          } else if (payload.eventType === "UPDATE") {
            setDirectMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)));
          } else if (payload.eventType === "DELETE") {
            setDirectMessages((prev) => prev.filter((m) => m.id !== row.id));
          }
        }
      )
      .subscribe();

    const readsChannel = supabase
      .channel(`team-chat-reads-${user.id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_message_reads" },
        (payload) => {
          const row = payload.new as { message_id: string; user_id: string };
          if (row.user_id === user.id) {
            setReadSet((prev) => {
              if (prev.has(row.message_id)) return prev;
              const next = new Set(prev);
              next.add(row.message_id);
              return next;
            });
          } else {
            // Someone read a message — if it was mine, mark outgoing as read
            setOutgoingReadSet((prev) => {
              if (prev.has(row.message_id)) return prev;
              const next = new Set(prev);
              next.add(row.message_id);
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(groupChannel);
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(readsChannel);
    };
  }, [teamId, user?.id]);

  /* ---------- thread for currently selected DM ---------- */
  const activeThread = useMemo(() => {
    if (activeMode === "group") return groupMessages;
    if (!selectedRecipientId || !user) return [];
    return directMessages
      .filter(
        (m) =>
          (m.sender_id === user.id && m.recipient_id === selectedRecipientId) ||
          (m.sender_id === selectedRecipientId && m.recipient_id === user.id)
      )
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }, [activeMode, groupMessages, directMessages, selectedRecipientId, user?.id]);

  /* ---------- mark messages read on view ---------- */
  useEffect(() => {
    if (!user) return;
    const visible = activeThread.filter(
      (m) =>
        !m.is_deleted &&
        m.sender_id !== user.id &&
        (m.is_group || m.recipient_id === user.id) &&
        !readSet.has(m.id)
    );
    if (visible.length === 0) return;
    const ids = visible.map((m) => m.id);
    markMessagesAsRead(ids, user.id).catch((e) => console.error("read receipt failed", e));
    // optimistic local
    setReadSet((prev) => {
      const next = new Set(prev);
      ids.forEach((i) => next.add(i));
      return next;
    });
  }, [activeThread, user?.id, readSet]);

  /* ---------- auto-scroll on new messages in active thread ---------- */
  const lastLenRef = useRef(0);
  useEffect(() => {
    if (activeThread.length !== lastLenRef.current) {
      lastLenRef.current = activeThread.length;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeThread]);

  /* ---------- unread counts ---------- */
  const unreadByMember = useMemo(() => {
    const map = new Map<string, number>();
    if (!user) return map;
    directMessages.forEach((m) => {
      if (m.is_deleted) return;
      if (m.recipient_id !== user.id) return;
      if (readSet.has(m.id)) return;
      map.set(m.sender_id, (map.get(m.sender_id) ?? 0) + 1);
    });
    return map;
  }, [directMessages, readSet, user?.id]);

  const groupUnread = useMemo(() => {
    if (!user) return 0;
    return groupMessages.filter(
      (m) => !m.is_deleted && m.sender_id !== user.id && !readSet.has(m.id)
    ).length;
  }, [groupMessages, readSet, user?.id]);

  /* ---------- sending ---------- */
  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || !user || !teamId || sending) return;
    if (activeMode === "direct" && !selectedRecipientId) return;
    if (activeMode === "direct" && selectedRecipientId === user.id) return;

    setSending(true);
    try {
      if (activeMode === "group") {
        await sendGroupMessage(teamId, user.id, content);
      } else {
        await sendDirectMessage(teamId, user.id, selectedRecipientId!, content);
      }
      setNewMessage("");
      // ensure scroll
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  /* ---------- edit / delete ---------- */
  const startEdit = (m: ChatMessageRow) => {
    setOpenMenuId(null);
    setEditingId(m.id);
    setEditingValue(m.content);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditingValue("");
  };
  const saveEdit = async () => {
    if (!editingId) return;
    const value = editingValue.trim();
    if (!value) return;
    try {
      await editMessage(editingId, value);
      cancelEdit();
    } catch (err: any) {
      toast.error(err?.message || "Failed to edit");
    }
  };
  const handleDelete = async (id: string) => {
    setOpenMenuId(null);
    if (!confirm("Delete this message?")) return;
    try {
      await softDeleteMessage(id);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete");
    }
  };

  /* ---------- selecting / switching ---------- */
  const openGroup = () => {
    setActiveMode("group");
    setSelectedRecipientId(null);
    setMobileShowList(false);
  };
  const openDm = (memberId: string) => {
    setActiveMode("direct");
    setSelectedRecipientId(memberId);
    setMobileShowList(false);
  };
  const backToList = () => {
    setMobileShowList(true);
  };

  /* ---------- guards ---------- */
  if (!teamId) {
    return (
      <div className="p-4 space-y-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Command · Comms</p>
          <h1 className="text-2xl font-bold font-display text-foreground">Chat</h1>
        </div>
        <div className="bg-card rounded-2xl p-8 text-center text-sm text-muted-foreground shadow-[var(--card-shadow)]">
          Join or create a team to use chat.
        </div>
      </div>
    );
  }

  /* ---------- filter chip state ---------- */
  const totalUnread = groupUnread + Array.from(unreadByMember.values()).reduce((a, b) => a + b, 0);
  const staffMembers = otherMembers.filter((m) => m.role === "coach" || m.role === "manager");

  const [listFilter, _setListFilter] = [
    // inline read-only usage; use local state
    (undefined as unknown as "all" | "unread" | "staff"),
    (undefined as unknown as (v: "all" | "unread" | "staff") => void),
  ];

  /* ---------- panes ---------- */
  const ListPane = (
    <div className="flex flex-col h-full bg-card/40 md:bg-transparent md:border-r md:border-border/60 backdrop-blur-sm">
      {/* Rail header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/60">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Command · Comms</p>
        <div className="flex items-baseline justify-between gap-2 mt-0.5">
          <h2 className="text-xl font-bold font-display text-foreground leading-none">Inbox</h2>
          {totalUnread > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
              {totalUnread} unread
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          {teamMembers.length} teammate{teamMembers.length === 1 ? "" : "s"} · {staffMembers.length} staff
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {/* Team broadcast */}
        <div className="px-2 pt-1 pb-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">Broadcast</p>
        </div>
        <button
          onClick={openGroup}
          className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors border ${
            activeMode === "group" && !mobileShowList
              ? "bg-primary/10 border-primary/30"
              : "border-transparent hover:bg-muted/70"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Team Channel</p>
            <p className="text-xs text-muted-foreground truncate">
              {groupMessages.length === 0
                ? "No messages yet — start the huddle."
                : (() => {
                    const last = groupMessages[groupMessages.length - 1];
                    const sender = memberMap.get(last.sender_id)?.display_name ?? "Someone";
                    return `${sender}: ${last.is_deleted ? "Message deleted" : last.content}`;
                  })()}
            </p>
          </div>
          {groupUnread > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {groupUnread}
            </span>
          )}
        </button>

        {/* DMs */}
        <div className="pt-4 px-2 pb-1 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">Direct</p>
          <span className="text-[10px] text-muted-foreground">{otherMembers.length}</span>
        </div>

        <div className="px-1 pb-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teammates…"
              className="w-full pl-8 pr-2 py-2 text-xs bg-background border border-border/70 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {filteredMembers.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            {otherMembers.length === 0 ? "No teammates yet." : "No matches."}
          </p>
        )}

        {filteredMembers.map((m) => {
          const unread = unreadByMember.get(m.user_id) ?? 0;
          const isSelected = activeMode === "direct" && selectedRecipientId === m.user_id && !mobileShowList;
          const isStaff = m.role === "coach" || m.role === "manager";
          return (
            <button
              key={m.user_id}
              onClick={() => openDm(m.user_id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors border ${
                isSelected ? "bg-primary/10 border-primary/30" : "border-transparent hover:bg-muted/70"
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl bg-muted text-foreground flex items-center justify-center text-sm font-semibold overflow-hidden ring-1 ring-border/60">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    m.display_name.charAt(0).toUpperCase()
                  )}
                </div>
                {isStaff && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center ring-2 ring-background">
                    <Shield className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{m.display_name}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{m.role}</p>
              </div>
              {unread > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const ThreadHeader = () => {
    if (activeMode === "group") {
      return (
        <div className="flex items-center gap-3">
          <button onClick={backToList} className="md:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-muted" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Broadcast Channel</p>
            <p className="text-sm font-bold font-display text-foreground truncate">Team Channel · {teamMembers.length}</p>
          </div>
        </div>
      );
    }
    const partner = selectedRecipientId ? memberMap.get(selectedRecipientId) : null;
    return (
      <div className="flex items-center gap-3">
        <button onClick={backToList} className="md:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-muted" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-muted text-foreground flex items-center justify-center text-sm font-semibold overflow-hidden ring-1 ring-border/60">
          {partner?.avatar_url ? (
            <img src={partner.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            partner?.display_name.charAt(0).toUpperCase() ?? "?"
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-1">
            Direct Message
            {partner && (partner.role === "coach" || partner.role === "manager") && (
              <span className="inline-flex items-center gap-0.5 text-primary">
                <Shield className="w-2.5 h-2.5" />
                <span className="capitalize">{partner.role}</span>
              </span>
            )}
          </p>
          <p className="text-sm font-bold font-display text-foreground truncate">{partner?.display_name ?? "Unknown"}</p>
        </div>
      </div>
    );
  };


  const renderMessage = (msg: ChatMessageRow) => {
    const isMe = msg.sender_id === user?.id;
    const profile = memberMap.get(msg.sender_id);
    const name = profile?.display_name ?? "Unknown";
    const isEditing = editingId === msg.id;

    return (
      <div key={msg.id} className={`group/msg flex ${isMe ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[80%] flex items-start gap-1">
          {isMe && !msg.is_deleted && !isEditing && (
            <div className="relative self-center">
              <button
                onClick={() => setOpenMenuId((id) => (id === msg.id ? null : msg.id))}
                className="p-1 rounded hover:bg-muted opacity-0 group-hover/msg:opacity-100 transition-opacity"
                aria-label="Message actions"
              >
                <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {openMenuId === msg.id && (
                <div className="absolute right-full top-0 mr-1 z-10 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[120px]">
                  <button
                    onClick={() => startEdit(msg)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2 text-destructive"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}

          <div
            className={`rounded-2xl px-3.5 py-2 ${
              msg.is_deleted
                ? "bg-muted text-muted-foreground italic"
                : isMe
                ? "bg-primary text-primary-foreground"
                : "bg-card shadow-[var(--card-shadow)]"
            }`}
          >
            {!isMe && msg.is_group && !msg.is_deleted && (
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-semibold text-card-foreground">{name}</span>
                {profile && (profile.role === "coach" || profile.role === "manager") && (
                  <span className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold bg-primary text-primary-foreground uppercase">
                    <Shield className="w-2 h-2" /> {profile.role}
                  </span>
                )}
              </div>
            )}

            {msg.is_deleted ? (
              <p className="text-sm">Message deleted</p>
            ) : isEditing ? (
              <div className="space-y-1.5">
                <textarea
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  rows={2}
                  className="w-full text-sm rounded-md p-1.5 text-foreground bg-background border border-border resize-none"
                />
                <div className="flex gap-1.5">
                  <button onClick={saveEdit} className="px-2 py-0.5 rounded bg-background text-primary text-xs font-medium">
                    Save
                  </button>
                  <button onClick={cancelEdit} className="px-2 py-0.5 rounded bg-background/30 text-xs">
                    <X className="w-3 h-3 inline" />
                  </button>
                </div>
              </div>
            ) : (
              <p className={`text-sm whitespace-pre-wrap break-words ${isMe ? "" : "text-card-foreground"}`}>
                {msg.content}
              </p>
            )}

            {!msg.is_deleted && !isEditing && (
              <div className={`flex items-center justify-end gap-1 mt-0.5 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {msg.edited_at && <span className="text-[10px] italic">edited</span>}
                <span className="text-[10px]">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                {isMe && !msg.is_group && (
                  outgoingReadSet.has(msg.id)
                    ? <CheckCheck className="w-3 h-3" />
                    : <Check className="w-3 h-3" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ThreadPane = (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border bg-background sticky top-0 z-10">
        <ThreadHeader />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : activeThread.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            {activeMode === "group"
              ? "No team messages yet. Start the conversation."
              : "No messages with this teammate yet."}
          </p>
        ) : (
          activeThread.map(renderMessage)
        )}
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
                handleSend();
              }
            }}
            placeholder={
              activeMode === "group"
                ? "Message the team…"
                : `Message ${selectedRecipientId ? memberMap.get(selectedRecipientId)?.display_name ?? "" : ""}…`
            }
            rows={1}
            maxLength={1000}
            disabled={activeMode === "direct" && !selectedRecipientId}
            className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none max-h-32 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={sending || !newMessage.trim() || (activeMode === "direct" && !selectedRecipientId)}
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

  /* ---------- layout ---------- */
  return (
    <div className="md:h-[calc(100vh-3rem)] h-[calc(100vh-9rem)] flex flex-col md:flex-row md:gap-0 -m-4 md:-m-6 md:-my-6">
      {/* Desktop: split. Mobile: list OR thread. */}
      <div className={`md:w-72 md:shrink-0 md:border-r md:border-border ${mobileShowList ? "block" : "hidden"} md:block flex-1 md:flex-none min-h-0`}>
        {ListPane}
      </div>
      <div className={`flex-1 min-h-0 ${mobileShowList ? "hidden" : "block"} md:block`}>
        {ThreadPane}
      </div>
    </div>
  );
};

const Header = ({ title }: { title: string }) => (
  <div>
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Messages</p>
    <h1 className="text-2xl font-bold font-display text-foreground">{title}</h1>
  </div>
);

export default Chat;
