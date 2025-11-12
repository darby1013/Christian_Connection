import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Database, Activity, Users, Zap, Clock, TrendingUp,
  AlertTriangle, CheckCircle, Server
} from "lucide-react";

export default function AdminConnectionPoolMonitor() {
  const poolStats = {
    total_connections: 100,
    active_connections: 45,
    idle_connections: 50,
    waiting_connections: 5,
    max_connections: 100,
    connection_timeout: 30,
    idle_timeout: 600,
    avg_wait_time: 12,
    peak_connections: 78,
    health_status: 'healthy'
  };

  const connectionHistory = [
    { time: '14:00', active: 45, idle: 50, waiting: 5 },
    { time: '14:05', active: 52, idle: 43, waiting: 5 },
    { time: '14:10', active: 48, idle: 47, waiting: 5 },
    { time: '14:15', active: 61, idle: 34, waiting: 5 },
    { time: '14:20', active: 45, idle: 50, waiting: 5 }
  ];

  const activeQueries = [
    { id: 1, query: 'SELECT * FROM Product WHERE category = ?', duration: 2.3, user: 'app_user_1' },
    { id: 2, query: 'UPDATE Order SET status = ? WHERE id = ?', duration: 1.8, user: 'app_user_2' },
    { id: 3, query: 'SELECT COUNT(*) FROM CustomerLoyalty', duration: 0.5, user: 'app_user_3' }
  ];

  const utilization = (poolStats.active_connections / poolStats.total_connections) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Connection Pool Monitor</h2>
          <p className="text-slate-400 font-semibold">Real-time database connection monitoring</p>
        </div>
        <Badge className={`${utilization > 80 ? 'bg-amber-500' : 'bg-green-500'} px-4 py-2 text-lg`}>
          {poolStats.health_status.toUpperCase()}
        </Badge>
      </div>

      {/* Pool Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">Active</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{poolStats.active_connections}</p>
            <p className="text-slate-400 text-sm font-semibold">Active Connections</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">Idle</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{poolStats.idle_connections}</p>
            <p className="text-slate-400 text-sm font-semibold">Idle Connections</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
              <Badge className="bg-amber-500">Waiting</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{poolStats.waiting_connections}</p>
            <p className="text-slate-400 text-sm font-semibold">Waiting</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">Peak</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{poolStats.peak_connections}</p>
            <p className="text-slate-400 text-sm font-semibold">Peak Usage</p>
          </CardContent>
        </Card>
      </div>

      {/* Pool Utilization */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Pool Utilization</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-400 text-sm">Total Usage</span>
                <span className="text-white font-bold">{utilization.toFixed(1)}%</span>
              </div>
              <Progress value={utilization} className="h-3" />
            </div>
            <div className="grid md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-200 text-sm">Active</span>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-2xl font-black text-white">{poolStats.active_connections}/{poolStats.total_connections}</p>
              </div>
              <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-cyan-200 text-sm">Avg Wait</span>
                  <Clock className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-2xl font-black text-white">{poolStats.avg_wait_time}ms</p>
              </div>
              <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-200 text-sm">Timeout</span>
                  <Server className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-2xl font-black text-white">{poolStats.connection_timeout}s</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Queries */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Active Queries ({activeQueries.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {activeQueries.map((query) => (
              <div key={query.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-cyan-500 text-xs">{query.duration}s</Badge>
                      <span className="text-slate-400 text-xs">{query.user}</span>
                    </div>
                    <pre className="text-green-400 font-mono text-xs overflow-x-auto">
                      {query.query}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}