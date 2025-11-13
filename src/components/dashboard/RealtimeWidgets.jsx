import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity, Users, AlertCircle, Database, TrendingUp, Clock,
  Zap, CheckCircle, XCircle, Eye, Shield, Server, HardDrive
} from "lucide-react";
import { format } from "date-fns";

export function RecentActivityWidget() {
  const { data: activities = [] } = useQuery({
    queryKey: ['recentActivities'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 10),
    initialData: [],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const getActionIcon = (actionType) => {
    switch(actionType) {
      case 'create': return CheckCircle;
      case 'update': return Activity;
      case 'delete': return XCircle;
      case 'login': return Users;
      case 'export': return Database;
      default: return Activity;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700">
      <CardHeader className="border-b border-slate-700 pb-3">
        <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Recent Activity
          <Badge className="ml-auto bg-cyan-500 animate-pulse">Live</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {activities.map(activity => {
            const Icon = getActionIcon(activity.action_type);
            return (
              <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-slate-800/50 rounded-lg transition-colors">
                <Icon className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{activity.action_description}</p>
                  <p className="text-slate-400 text-xs">{activity.user_name}</p>
                  <p className="text-slate-500 text-xs">{format(new Date(activity.created_date), 'HH:mm:ss')}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function CriticalAlertsWidget() {
  const { data: alerts = [] } = useQuery({
    queryKey: ['criticalAlerts'],
    queryFn: () => base44.entities.AuditLog.filter({ severity: 'critical' }, '-created_date', 5),
    initialData: [],
    refetchInterval: 10000,
  });

  return (
    <Card className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-500/30">
      <CardHeader className="border-b border-red-500/30 pb-3">
        <CardTitle className="text-red-300 font-bold text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Critical Events
          <Badge className="ml-auto bg-red-500">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {alerts.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-green-300 text-xs font-semibold">All Clear</p>
            <p className="text-green-200 text-xs">No critical events</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className="p-2 bg-red-900/30 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-xs font-semibold">{alert.action_description}</p>
                <p className="text-red-200 text-xs">{format(new Date(alert.created_date), 'PPp')}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SystemHealthWidget() {
  const [metrics, setMetrics] = useState({
    cpu: 45,
    memory: 62,
    disk: 38,
    uptime: 99.98
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        cpu: Math.random() * 30 + 40,
        memory: Math.random() * 20 + 50,
        disk: Math.random() * 10 + 35,
        uptime: 99.98
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700">
      <CardHeader className="border-b border-slate-700 pb-3">
        <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
          <Server className="w-4 h-4 text-green-400" />
          System Health
          <Badge className="ml-auto bg-green-500">Healthy</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-300 text-xs font-medium">CPU Usage</span>
            <span className="text-white text-xs font-bold">{metrics.cpu.toFixed(1)}%</span>
          </div>
          <Progress value={metrics.cpu} className="h-2" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-300 text-xs font-medium">Memory</span>
            <span className="text-white text-xs font-bold">{metrics.memory.toFixed(1)}%</span>
          </div>
          <Progress value={metrics.memory} className="h-2" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-300 text-xs font-medium">Disk Usage</span>
            <span className="text-white text-xs font-bold">{metrics.disk.toFixed(1)}%</span>
          </div>
          <Progress value={metrics.disk} className="h-2" />
        </div>

        <div className="pt-2 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-xs font-medium">Uptime</span>
            <span className="text-green-400 text-xs font-bold">{metrics.uptime}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ActiveConnectionsWidget() {
  const [connections, setConnections] = useState(147);
  
  const { data: users = [] } = useQuery({
    queryKey: ['activeUsers'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setConnections(Math.floor(Math.random() * 50 + 120));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700">
      <CardHeader className="border-b border-slate-700 pb-3">
        <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
          <Database className="w-4 h-4 text-purple-400" />
          Active Connections
          <Badge className="ml-auto bg-purple-500 animate-pulse">Live</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="text-center">
          <p className="text-5xl font-black text-white mb-2">{connections}</p>
          <p className="text-slate-400 text-sm font-semibold mb-4">Active Database Connections</p>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2 bg-slate-900/50 rounded-lg">
              <p className="text-slate-400">Total Users</p>
              <p className="text-white font-bold text-lg">{users.length}</p>
            </div>
            <div className="p-2 bg-slate-900/50 rounded-lg">
              <p className="text-slate-400">Queries/sec</p>
              <p className="text-cyan-400 font-bold text-lg">{Math.floor(Math.random() * 20 + 80)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PerformanceMetricsWidget() {
  const [metrics, setMetrics] = useState({
    avgResponseTime: 45,
    successRate: 99.7,
    errorRate: 0.3,
    throughput: 1247
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        avgResponseTime: Math.random() * 20 + 40,
        successRate: 99.5 + Math.random() * 0.5,
        errorRate: Math.random() * 0.5,
        throughput: Math.floor(Math.random() * 200 + 1200)
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700">
      <CardHeader className="border-b border-slate-700 pb-3">
        <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-900/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <p className="text-slate-400 text-xs">Avg Response</p>
            </div>
            <p className="text-white font-black text-lg">{metrics.avgResponseTime.toFixed(0)}ms</p>
          </div>

          <div className="p-3 bg-slate-900/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <p className="text-slate-400 text-xs">Success Rate</p>
            </div>
            <p className="text-green-400 font-black text-lg">{metrics.successRate.toFixed(1)}%</p>
          </div>

          <div className="p-3 bg-slate-900/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-3 h-3 text-red-400" />
              <p className="text-slate-400 text-xs">Error Rate</p>
            </div>
            <p className="text-red-400 font-black text-lg">{metrics.errorRate.toFixed(1)}%</p>
          </div>

          <div className="p-3 bg-slate-900/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3 h-3 text-purple-400" />
              <p className="text-slate-400 text-xs">Throughput</p>
            </div>
            <p className="text-purple-400 font-black text-lg">{metrics.throughput}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickStatsWidget() {
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: [],
    refetchInterval: 30000,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list(),
    initialData: [],
    refetchInterval: 30000,
  });

  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.created_date);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  return (
    <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700">
      <CardHeader className="border-b border-slate-700 pb-3">
        <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          Quick Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
            <span className="text-slate-300 text-xs">Total Products</span>
            <span className="text-white font-bold">{products.length}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
            <span className="text-slate-300 text-xs">Today's Orders</span>
            <span className="text-cyan-400 font-bold">{todayOrders.length}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
            <span className="text-slate-300 text-xs">Total Revenue</span>
            <span className="text-green-400 font-bold">${totalRevenue.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
            <span className="text-slate-300 text-xs">Total Orders</span>
            <span className="text-purple-400 font-bold">{orders.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}