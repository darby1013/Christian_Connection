import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, Crown, Shield, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RealtimeChat({ roomId, roomType, user }) {
  const [message, setMessage] = useState("");
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', roomId],
    queryFn: () => base44.entities.ChatMessage.filter({ room_id: roomId }, '-created_date', 100),
    initialData: [],
    refetchInterval: 2000, // Real-time polling every 2 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: (msgData) => base44.entities.ChatMessage.create(msgData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', roomId] });
      setMessage("");
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      room_id: roomId,
      room_type: roomType,
      sender_id: user.id,
      sender_name: user.full_name,
      message: message.trim(),
      is_system: false
    });
  };

  const getUserBadge = (msg) => {
    // Mock subscription check - in production, check actual subscription
    if (msg.sender_name?.includes('Admin')) {
      return <Crown className="w-3 h-3 text-yellow-400 fill-yellow-400" />;
    }
    if (msg.sender_name?.includes('Mod')) {
      return <Shield className="w-3 h-3 text-blue-400" />;
    }
    return null;
  };

  return (
    <Card className="bg-[#1a1f3a] border-slate-700 h-full flex flex-col">
      <CardHeader className="border-b border-slate-700 py-3">
        <CardTitle className="text-white font-black text-base flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-cyan-400" />
          Live Chat
          <Badge variant="outline" className="ml-auto border-green-500/30 text-green-400">
            {messages.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          <AnimatePresence initial={false}>
            {messages.slice().reverse().map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={`mb-3 ${msg.is_system ? 'text-center' : ''}`}
              >
                {msg.is_system ? (
                  <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                    {msg.message}
                  </Badge>
                ) : (
                  <div className="group hover:bg-slate-800/30 p-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      {getUserBadge(msg)}
                      <span className="text-cyan-400 font-bold text-sm">
                        {msg.sender_name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-white text-sm leading-relaxed pl-5">
                      {msg.message}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </ScrollArea>

        <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={user ? "Send a message..." : "Sign in to chat"}
              disabled={!user || sendMessageMutation.isPending}
              className="bg-slate-800/50 border-slate-700 text-white flex-1"
              maxLength={500}
            />
            <Button
              type="submit"
              disabled={!user || !message.trim() || sendMessageMutation.isPending}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          {!user && (
            <p className="text-xs text-slate-400 mt-2 text-center">
              <button onClick={() => base44.auth.redirectToLogin()} className="text-cyan-400 hover:underline">
                Sign in
              </button> to join the conversation
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}