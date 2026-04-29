import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, X, Send, User } from "lucide-react";
import { toast } from "sonner";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();

  const { data: messages, isLoading } = trpc.message.list.useQuery(undefined, {
    enabled: isAuthenticated && open,
  });

  const utils = trpc.useUtils();
  const createMessage = trpc.message.create.useMutation({
    onSuccess: () => {
      utils.message.list.invalidate();
      setMessage("");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send message");
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to use support chat");
      return;
    }
    if (!message.trim()) return;
    createMessage.mutate({ content: message.trim() });
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 flex items-center justify-center transition-all duration-300 shadow-lg ${
          open ? "bg-black text-white" : "bg-[#e63946] text-white hover:bg-[#d62839]"
        }`}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-h-[520px] bg-white border border-black/10 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 bg-black text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Studio Support
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-[10px] text-white/60">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-[300px] max-h-[360px]"
          >
            {!isAuthenticated ? (
              <div className="text-center py-8">
                <User className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-xs text-gray-500 mb-3">
                  Sign in to start a conversation with our studio team.
                </p>
                <Button
                  size="sm"
                  className="bg-black text-white rounded-none text-xs uppercase tracking-widest"
                  onClick={() => (window.location.href = "/login")}
                >
                  Sign In
                </Button>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              </div>
            ) : messages && messages.length > 0 ? (
              [...messages].reverse().map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.senderType === "client" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 text-xs leading-relaxed ${
                      msg.senderType === "client"
                        ? "bg-black text-white"
                        : "bg-neutral-100 text-gray-800"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className="text-[9px] opacity-50 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-gray-400">
                  No messages yet. Start the conversation!
                </p>
              </div>
            )}
          </div>

          {/* Input */}
          {isAuthenticated && (
            <div className="px-3 py-3 border-t border-black/10 flex gap-2">
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="rounded-none border-gray-200 text-xs"
              />
              <Button
                size="sm"
                className="bg-black text-white hover:bg-black/80 rounded-none px-3"
                onClick={handleSend}
                disabled={createMessage.isPending || !message.trim()}
              >
                <Send className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
