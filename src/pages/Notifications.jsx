import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Bell, CheckCircle, X, Trash2, Eye, Clock,
  AlertTriangle, Database, FileText, Podcast, MessageCircle,
  Heart, Users, ShoppingBag, Radio, Video
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Not logged in');
      }
    };
    fetchUser();
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: user?.id }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.Notification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.Notification.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

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

  const deleteAllReadMutation = useMutation({
    mutationFn: async () => {
      const readNotifications = notifications.filter(n => n.is_read);
      await Promise.all(
        readNotifications.map(n => 
          base44.entities.Notification.delete(n.id)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      alert('✅ All read notifications deleted');
    },
  });

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'database_alert': return <Database className="w-6 h-6 text-red-400" />;
      case 'backup_failure': return <AlertTriangle className="w-6 h-6 text-red-400" />;
      case 'high_latency': return <Clock className="w-6 h-6 text-amber-400" />;
      case 'blog_published': return <FileText className="w-6 h-6 text-cyan-400" />;
      case 'podcast_published': return <Podcast className="w-6 h-6 text-purple-400" />;
      case 'video_published': return <Video className="w-6 h-6 text-pink-400" />;
      case 'user_mention': return <MessageCircle className="w-6 h-6 text-cyan-400" />;
      case 'comment': return <MessageCircle className="w-6 h-6 text-blue-400" />;
      case 'like': return <Heart className="w-6 h-6 text-pink-400" />;
      case 'follow': return <Users className="w-6 h-6 text-purple-400" />;
      case 'stream_live': return <Radio className="w-6 h-6 text-red-400" />;
      case 'order_update': return <ShoppingBag className="w-6 h-6 text-green-400" />;
      default: return <Bell className="w-6 h-6 text-slate-400" />;
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : filter === 'critical'
    ? notifications.filter(n => ['database_alert', 'backup_failure'].includes(n.type) || n.priority === 'urgent')
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Notifications</h1>
            <p className="text-slate-400 font-semibold">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button onClick={() => markAllAsReadMutation.mutate()} className="bg-green-500 hover:bg-green-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            )}
            <Button onClick={() => deleteAllReadMutation.mutate()} variant="outline" className="border-red-500/30 text-red-400">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Read
            </Button>
          </div>
        </div>

        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList className="bg-[#1a1f3a] border border-slate-700 w-full justify-start">
            <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="data-[state=active]:bg-cyan-500">
              Unread ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="critical" className="data-[state=active]:bg-red-500">
              Critical ({notifications.filter(n => n.priority === 'urgent').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {filteredNotifications.length === 0 ? (
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-16 text-center">
              <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-bold text-xl mb-2">No Notifications</h3>
              <p className="text-slate-400">You're all caught up!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`bg-[#1a1f3a] border-slate-700 hover:border-cyan-500/50 transition-all ${
                  !notification.is_read ? 'ring-2 ring-cyan-500/30' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-white font-bold text-lg">{notification.title}</h3>
                        {notification.priority === 'urgent' && (
                          <Badge className="bg-red-500 animate-pulse flex-shrink-0">URGENT</Badge>
                        )}
                      </div>

                      <p className="text-slate-300 mb-3">{notification.message}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-sm flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(notification.created_date), 'PPpp')}
                        </span>

                        <div className="flex gap-2">
                          {notification.link && (
                            <Link to={notification.link}>
                              <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </Link>
                          )}
                          {!notification.is_read && (
                            <Button
                              size="sm"
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Mark Read
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => deleteNotificationMutation.mutate(notification.id)}
                            variant="outline"
                            className="border-red-500/30 text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}