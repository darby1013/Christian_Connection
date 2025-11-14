import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Send, Users, Activity, Circle, Smile, Paperclip, MoreVertical
} from "lucide-react";
import { formatDistance } from "date-fns";

export default function LiveGroupChat({ groupId, user, className = "" }) {
  const [message, setMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['groupMessages', groupId],
    queryFn: async () => {
      const msgs = await base44.entities.ChatMessage.filter(
        { group_id: groupId },
        '-created_date',
        100
      );
      return msgs.reverse();
    },
    enabled: !!groupId,
    refetchInterval: 2000, // Real-time polling every 2 seconds
  });

  const { data: members = [] } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: groupId, is_active: true }),
    enabled: !!groupId,
    refetchInterval: 10000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      return await base44.entities.ChatMessage.create(messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMessages', groupId] });
      setMessage('');
    },
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      group_id: groupId,
      user_id: user.id,
      user_name: user.full_name,
      user_image: user.profile_image,
      message: message.trim(),
      message_type: 'text'
    });
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate online users (in production, track via presence system)
  useEffect(() => {
    const activeMembers = members
      .filter(m => m.is_active)
      .slice(0, 10)
      .map(m => ({
        ...m,
        online: Math.random() > 0.3 // Simulate 70% online
      }));
    setOnlineUsers(activeMembers);
  }, [members]);

  return (
    <Card className={`bg-[#1a1f3a] border-slate-700 flex flex-col ${className}`}>
      <CardHeader className="border-b border-slate-700 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Live Chat
          </CardTitle>
          <Badge className="bg-green-500">
            <Circle className="w-2 h-2 mr-1 fill-current" />
            {onlineUsers.filter(u => u.online).length} online
          </Badge>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[500px]">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwnMessage = msg.user_id === user?.id;
            const showAvatar = idx === 0 || messages[idx - 1].user_id !== msg.user_id;

            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {showAvatar ? (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={msg.user_image} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white text-xs">
                      {msg.user_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8"></div>
                )}

                <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                  {showAvatar && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-slate-300 font-semibold text-xs">{msg.user_name}</span>
                      <span className="text-slate-500 text-xs">
                        {formatDistance(new Date(msg.created_date), new Date(), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isOwnMessage
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                        : 'bg-slate-800 text-slate-100'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input */}
      <CardContent className="p-4 border-t border-slate-700">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-900 border-slate-700 text-white"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>

      {/* Online Users Sidebar (optional, can be shown separately) */}
      {onlineUsers.length > 0 && (
        <CardContent className="p-4 border-t border-slate-700 max-h-40 overflow-y-auto">
          <p className="text-slate-400 text-xs font-bold mb-2">ONLINE NOW</p>
          <div className="space-y-1">
            {onlineUsers.filter(u => u.online).map(member => (
              <div key={member.id} className="flex items-center gap-2">
                <Circle className="w-2 h-2 text-green-500 fill-current" />
                <span className="text-slate-300 text-xs">{member.user_name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}