import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Check, X, Video, MessageSquare, Heart, Users, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function NotificationBell({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: user?.id }, '-created_date', 20),
    enabled: !!user,
    refetchInterval: 5000, // Real-time updates every 5 seconds
    initialData: [],
  });

  const markAsReadMutation = useMutation({
    mutationFn: ({ id }) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type) => {
    const icons = {
      stream_live: Video,
      new_video: Video,
      new_post: FileText,
      donation_received: Heart,
      comment: MessageSquare,
      follow: Users,
    };
    return icons[type] || Bell;
  };

  const handleNotificationClick = (notification) => {
    markAsReadMutation.mutate({ id: notification.id });
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  const markAllAsRead = () => {
    notifications.forEach(n => {
      if (!n.is_read) {
        markAsReadMutation.mutate({ id: n.id });
      }
    });
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-white/10 rounded-lg">
          <Bell className="w-5 h-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <Badge className="bg-red-500 text-white px-1.5 py-0.5 text-xs font-bold min-w-[18px] h-[18px] flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 bg-[#1a1f3a] border-slate-700 p-0" align="end">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-white font-bold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-cyan-400 hover:text-cyan-300 text-xs"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {notifications.map((notif) => {
                const Icon = getIcon(notif.type);
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 hover:bg-slate-800/50 cursor-pointer transition-colors ${
                      !notif.is_read ? 'bg-cyan-500/5' : ''
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notif.priority === 'urgent' ? 'bg-red-500/20' :
                        notif.priority === 'high' ? 'bg-orange-500/20' :
                        'bg-cyan-500/20'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          notif.priority === 'urgent' ? 'text-red-400' :
                          notif.priority === 'high' ? 'text-orange-400' :
                          'text-cyan-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold text-sm mb-1">{notif.title}</h4>
                        <p className="text-slate-400 text-xs line-clamp-2">{notif.message}</p>
                        <p className="text-slate-500 text-xs mt-1">
                          {new Date(notif.created_date).toRelativeTime?.() || new Date(notif.created_date).toLocaleString()}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <div className="w-2 h-2 bg-cyan-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}