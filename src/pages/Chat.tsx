import { useState, useEffect, useRef } from "react";
import { Send, Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_group: boolean;
  sender_name?: string;
  sender_role?: string;
}

const Chat = () => {
  const { user, role, teamId } = useAuth();
  const [activeTab, setActiveTab] = useState<"individual" | "group">("group");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, { name: string; role: string }>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch profiles for display names
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name");
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const profileMap: Record<string, { name: string; role: string }> = {};
      profs?.forEach((p) => {
        const r = roles?.find((r) => r.user_id === p.user_id);
        profileMap[p.user_id] = { name: p.display_name, role: r?.role || "player" };
      });
      setProfiles(profileMap);
    };
    fetchProfiles();
  }, []);

  // Fetch & subscribe to group messages
  useEffect(() => {
    if (!teamId) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("id, sender_id, content, created_at, is_group")
        .eq("team_id", teamId)
        .eq("is_group", true)
        .order("created_at", { ascending: true })
        .limit(100);
      setMessages((data as ChatMessage[]) || []);
    };
    fetchMessages();

    const channel = supabase
      .channel("team-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `team_id=eq.${teamId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [teamId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !teamId) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      sender_id: user.id,
      team_id: teamId,
      is_group: true,
      content: newMessage.trim(),
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setNewMessage("");
  };

  const getProfile = (id: string) => profiles[id] || { name: "Unknown", role: "player" };

  return (
    <div className="p-4 space-y-4 pb-36">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Messages</p>
        <h1 className="text-2xl font-bold font-display text-foreground">Chat</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1">
        {(["individual", "group"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              activeTab === tab ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "group" ? (
        <div className="space-y-2">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Start the conversation!</p>
          )}
          {messages.map((msg) => {
            const profile = getProfile(msg.sender_id);
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl p-3 ${isMe ? "bg-primary text-primary-foreground" : "bg-card shadow-[var(--card-shadow)]"}`}>
                  {!isMe && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-semibold text-card-foreground">{profile.name}</span>
                      {profile.role === "coach" && (
                        <span className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold bg-primary text-primary-foreground uppercase">
                          <Shield className="w-2 h-2" /> Admin
                        </span>
                      )}
                    </div>
                  )}
                  <p className={`text-sm ${isMe ? "" : "text-card-foreground"}`}>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">Direct messages coming soon</p>
      )}

      {/* Quick Message */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
        <div className="flex gap-2 bg-card rounded-xl p-2 shadow-[var(--card-shadow-hover)] border border-border">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            maxLength={500}
            className="flex-1 px-3 py-2 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" /> : <Send className="w-4 h-4 text-primary-foreground" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
