import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity, User, FileText, ShoppingBag, Settings,
  Shield, AlertTriangle, CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ActivityFeedWidget({ limit = 10, showTitle = true }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['recentActivities', limit],
    queryFn: () => base44.entities.UserActivity.list('-created_date', limit),
    initialData: [],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getActionIcon = (actionType) => {
    switch(actionType) {
      case 'content_created':
      case 'content_updated':
      case 'content_deleted': return <FileText className="w-4 h-4" />;
      case 'user_created':
      case 'user_updated':
      case 'user_deleted': return <User className="w-4 h-4" />;
      case 'role_assigned':
      case 'role_unassigned': return <Shield className="w-4 h-4" />;
      case 'order_placed':
      case 'order_updated': return <ShoppingBag className="w-4 h-4" />;
      case 'product_created':
      case 'product_updated': return <ShoppingBag className="w-4 h-4" />;
      case 'setting_changed': return <Settings className="w-4 h-4" />;
      case 'system_alert': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActionColor = (actionType) => {
    switch(actionType) {
      case 'content_created':
      case 'user_created':
      case 'product_created': return 'from-green-500 to-emerald-500';
      case 'content_updated':
      case 'user_updated':
      case 'order_updated': return 'from-blue-500 to-cyan-500';
      case 'content_deleted':
      case 'user_deleted': return 'from-red-500 to-rose-500';
      case 'role_assigned': return 'from-purple-500 to-pink-500';
      case 'order_placed': return 'from-cyan-500 to-blue-500';
      case 'setting_changed': return 'from-amber-500 to-orange-500';
      case 'system_alert': return 'from-red-600 to-red-700';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <Card className="bg-[#1a1f3a] border-slate-700">
      {showTitle && (
        <CardHeader className="border-b border-slate-700 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Recent Activity
            </CardTitle>
            <Link to={createPageUrl("AdminActivityFeed")}>
              <Badge className="bg-cyan-500 hover:bg-cyan-600 cursor-pointer">
                View All
              </Badge>
            </Link>
          </div>
        </CardHeader>
      )}
      <CardContent className={showTitle ? "p-4" : "p-0"}>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getActionColor(activity.action_type)} flex items-center justify-center text-white flex-shrink-0 shadow-lg`}>
                {getActionIcon(activity.action_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium line-clamp-1">
                  {activity.action_description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-slate-400 text-xs">{activity.user_name}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400 text-xs">
                    {new Date(activity.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}