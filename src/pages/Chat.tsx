import { useState } from "react";
import { Send, Shield } from "lucide-react";

const contacts = [
  { name: "Coach Miller", isAdmin: true, lastMsg: "Great practice today!", time: "2:30 PM" },
  { name: "Sarah J.", isAdmin: false, lastMsg: "Can we talk about the drill?", time: "1:15 PM" },
  { name: "Mike T.", isAdmin: false, lastMsg: "See you at practice 👋", time: "Yesterday" },
];

const groupChats = [
  { name: "Varsity Team", members: 18, lastMsg: "Coach Miller: Game plan for Friday", time: "3:00 PM", adminName: "Coach Miller" },
  { name: "Starting Lineup", members: 7, lastMsg: "Let's go! 🔥", time: "12:45 PM", adminName: "Coach Miller" },
];

const Chat = () => {
  const [activeTab, setActiveTab] = useState<"individual" | "group">("individual");

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
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
              activeTab === tab
                ? "bg-card text-card-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Contact List */}
      {activeTab === "individual" ? (
        <div className="space-y-2">
          {contacts.map((c, i) => (
            <div
              key={i}
              className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-muted-foreground">
                  {c.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-sm text-card-foreground truncate">{c.name}</p>
                  {c.isAdmin && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary text-primary-foreground uppercase">
                      <Shield className="w-2.5 h-2.5" /> Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{c.lastMsg}</p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{c.time}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {groupChats.map((g, i) => (
            <div
              key={i}
              className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-sm font-bold text-accent-foreground">
                      {g.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-card-foreground">{g.name}</p>
                    <p className="text-[10px] text-muted-foreground">{g.members} members</p>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground">{g.time}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{g.lastMsg}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Message */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
        <div className="flex gap-2 bg-card rounded-xl p-2 shadow-[var(--card-shadow-hover)] border border-border">
          <input
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
