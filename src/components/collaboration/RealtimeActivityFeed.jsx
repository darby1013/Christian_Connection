import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Activity, MessageSquare, ThumbsUp, Share2, FileText,
  Video, Mic2, ShoppingBag, Heart, Calendar, Users,
  Plus, Edit, Trash2, CheckCircle
} from "lucide-react";
import { formatDistance } from "date-fns";

const actionIcons = {
  content_created: Plus,
  content_updated: Edit,
  content_deleted: Trash2,
  user_created: Users,
  role_assigned: CheckCircle,
  order_placed: ShoppingBag,
  product_created: Plus,
  login: Activity,
  other: Activity
};

const actionColors = {
  content_created: 'text-green-400',
  content_updated: 'text-blue-400',
  content_deleted: 'text-red-400',
  user_created: 'text-purple-400',
  role_assigned: 'text-cyan-400',
  order_placed: 'text-emerald-400',
  product_created: 'text-amber-400',
  login: 'text-slate-400',
  other: 'text-slate-400'
};

export default function RealtimeActivityFeed({ groupId, limit = 20 }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['realtimeActivities', groupId],
    queryFn: async () => {
      const query = groupId ? { entity_id: groupId } : {};
      return await base44.entities.UserActivity.filter(query, '-created_date', limit);
    },
    refetchInterval: 3000, // Real-time updates every 3 seconds
    initialData: [],
  });

  return (
    <Card className="bg-[#1a1f3a] border-slate-700">
      <CardHeader className="border-b border-slate-700 pb-3">
        <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          Live Activity Feed
          <Badge className="bg-cyan-500 ml-2">Real-time</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 max-h-[600px] overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const ActionIcon = actionIcons[activity.action_type] || Activity;
              const iconColor = actionColors[activity.action_type] || 'text-slate-400';

              return (
                <div
                  key={activity.id}
                  className="flex gap-3 p-3 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-all"
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={activity.user_image} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white text-sm">
                      {activity.user_name?.[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm mb-1">
                          {activity.user_name}
                          <span className="text-slate-400 font-normal ml-2">
                            {activity.action_description}
                          </span>
                        </p>
                        {activity.entity_name && (
                          <p className="text-cyan-400 text-xs mb-1 truncate">
                            {activity.entity_type}: {activity.entity_name}
                          </p>
                        )}
                        <p className="text-slate-500 text-xs">
                          {formatDistance(new Date(activity.created_date), new Date(), { addSuffix: true })}
                        </p>
                      </div>
                      <ActionIcon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}