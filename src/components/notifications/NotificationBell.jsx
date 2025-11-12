import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Bell, AlertTriangle, CheckCircle, Info, Radio, FileText,
  Database, Upload, MessageCircle, Heart, Users, Podcast,
  Video, ShoppingBag, Clock, X, Eye
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NotificationBell({ user }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: user?.id }, '-created_date', 50),
    enabled: !!user,
    initialData: [],
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.Notification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => 
          base44.entities.Notification.update(n.id, { is_read: true })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.Notification.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'database_alert': return <Database className="w-5 h-5 text-red-400" />;
      case 'backup_failure': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'high_latency': return <Clock className="w-5 h-5 text-amber-400" />;
      case 'blog_published': return <FileText className="w-5 h-5 text-cyan-400" />;
      case 'podcast_published': return <Podcast className="w-5 h-5 text-purple-400" />;
      case 'video_published': return <Video className="w-5 h-5 text-pink-400" />;
      case 'data_import': return <Upload className="w-5 h-5 text-green-400" />;
      case 'data_export': return <Database className="w-5 h-5 text-blue-400" />;
      case 'user_mention': return <MessageCircle className="w-5 h-5 text-cyan-400" />;
      case 'comment': return <MessageCircle className="w-5 h-5 text-blue-400" />;
      case 'like': return <Heart className="w-5 h-5 text-pink-400" />;
      case 'follow': return <Users className="w-5 h-5 text-purple-400" />;
      case 'stream_live': return <Radio className="w-5 h-5 text-red-400" />;
      case 'order_update': return <ShoppingBag className="w-5 h-5 text-green-400" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'urgent' || type === 'database_alert' || type === 'backup_failure') {
      return 'bg-red-900/20 border-red-500/30 hover:bg-red-900/30';
    }
    if (priority === 'high' || type === 'high_latency') {
      return 'bg-amber-900/20 border-amber-500/30 hover:bg-amber-900/30';
    }
    return 'bg-slate-800/50 border-slate-700 hover:bg-slate-800';
  };

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'urgent': return <Badge className="bg-red-500 animate-pulse">URGENT</Badge>;
      case 'high': return <Badge className="bg-amber-500">HIGH</Badge>;
      case 'normal': return null;
      default: return null;
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : filter === 'critical'
    ? notifications.filter(n => ['database_alert', 'backup_failure', 'high_latency'].includes(n.type) || n.priority === 'urgent')
    : filter === 'content'
    ? notifications.filter(n => ['blog_published', 'podcast_published', 'video_published'].includes(n.type))
    : filter === 'system'
    ? notifications.filter(n => ['data_import', 'data_export', 'migration_complete'].includes(n.type))
    : filter === 'social'
    ? notifications.filter(n => ['user_mention', 'comment', 'like', 'follow'].includes(n.type))
    : notifications;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-white/10 rounded-lg">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 min-w-[20px] h-5 flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[420px] bg-[#1a1f3a] border-slate-700 p-0" align="end">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-cyan-400 hover:text-cyan-300 h-7 text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
          
          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: 'All', count: notifications.length },
              { value: 'unread', label: 'Unread', count: unreadCount },
              { value: 'critical', label: 'Critical', count: notifications.filter(n => ['database_alert', 'backup_failure'].includes(n.type)).length },
              { value: 'content', label: 'Content', count: notifications.filter(n => ['blog_published', 'podcast_published'].includes(n.type)).length },
              { value: 'system', label: 'System', count: notifications.filter(n => ['data_import', 'data_export'].includes(n.type)).length },
              { value: 'social', label: 'Social', count: notifications.filter(n => ['user_mention', 'comment', 'like'].includes(n.type)).length },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  filter === tab.value
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {tab.label} {tab.count > 0 && `(${tab.count})`}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[500px]">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-semibold">No notifications</p>
              <p className="text-slate-500 text-sm mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 transition-colors relative ${
                    !notification.is_read ? 'bg-cyan-900/10' : ''
                  } ${getNotificationColor(notification.type, notification.priority)}`}
                >
                  {/* Unread Indicator */}
                  {!notification.is_read && (
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-cyan-500 rounded-full" />
                  )}

                  <div className="flex items-start gap-3 pl-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-900/50 flex items-center justify-center flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-white font-semibold text-sm leading-tight">
                          {notification.title}
                        </h4>
                        {getPriorityBadge(notification.priority)}
                      </div>

                      <p className="text-slate-300 text-sm mb-2 line-clamp-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(notification.created_date), 'MMM d, HH:mm')}
                        </span>

                        <div className="flex gap-1">
                          {notification.link && (
                            <Link to={notification.link} onClick={() => markAsReadMutation.mutate(notification.id)}>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-cyan-400 hover:text-cyan-300">
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </Link>
                          )}
                          {!notification.is_read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                              className="h-7 px-2 text-xs text-green-400 hover:text-green-300"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Mark read
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNotificationMutation.mutate(notification.id)}
                            className="h-7 px-2 text-xs text-red-400 hover:text-red-300"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-slate-700">
          <Link to={createPageUrl("Notifications")}>
            <Button variant="ghost" className="w-full text-cyan-400 hover:text-cyan-300 hover:bg-slate-800">
              View all notifications
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}