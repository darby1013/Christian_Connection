import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Database, Activity, Users, Zap, Clock, TrendingUp,
  AlertTriangle, CheckCircle, Server, Bell, XCircle,
  RefreshCw, Download, BarChart3
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminConnectionPoolMonitor() {
  const [poolStats, setPoolStats] = useState({
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
  });

  const [historicalConnections, setHistoricalConnections] = useState([
    { time: '10:00', active: 38, idle: 57, waiting: 5, total: 100 },
    { time: '11:00', active: 42, idle: 53, waiting: 5, total: 100 },
    { time: '12:00', active: 48, idle: 47, waiting: 5, total: 100 },
    { time: '13:00', active: 61, idle: 34, waiting: 5, total: 100 },
    { time: '14:00', active: 45, idle: 50, waiting: 5, total: 100 }
  ]);

  const [activeQueries, setActiveQueries] = useState([
    { id: 1, query: 'SELECT * FROM Product WHERE category = ?', duration: 2.3, user: 'app_user_1', connection_id: 'conn_45' },
    { id: 2, query: 'UPDATE Order SET status = ? WHERE id = ?', duration: 1.8, user: 'app_user_2', connection_id: 'conn_67' },
    { id: 3, query: 'SELECT COUNT(*) FROM CustomerLoyalty WHERE tier = ?', duration: 0.5, user: 'app_user_3', connection_id: 'conn_23' },
    { id: 4, query: 'INSERT INTO ProductReview (product_id, rating, review_text) VALUES (?, ?, ?)', duration: 0.9, user: 'app_user_4', connection_id: 'conn_89' }
  ]);

  const [connectionAlerts, setConnectionAlerts] = useState([
    {
      id: 1,
      severity: 'warning',
      message: 'Connection pool approaching capacity (85% utilized)',
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
      action: 'Consider increasing max_connections to 150'
    },
    {
      id: 2,
      severity: 'info',
      message: 'Average wait time increased by 15%',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      action: 'Monitor query performance'
    }
  ]);

  const [showAlertsDialog, setShowAlertsDialog] = useState(false);

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPoolStats(prev => {
        const randomChange = Math.floor(Math.random() * 6) - 3;
        const newActive = Math.max(20, Math.min(80, prev.active_connections + randomChange));
        const newIdle = prev.total_connections - newActive - prev.waiting_connections;
        
        return {
          ...prev,
          active_connections: newActive,
          idle_connections: newIdle,
          peak_connections: Math.max(prev.peak_connections, newActive),
          avg_wait_time: Math.max(5, prev.avg_wait_time + (Math.random() - 0.5) * 2),
          health_status: newActive > 80 ? 'warning' : 'healthy'
        };
      });

      // Update historical data
      if (Math.random() > 0.7) {
        setHistoricalConnections(prev => {
          const now = format(new Date(), 'HH:mm');
          return [...prev.slice(-11), {
            time: now,
            active: poolStats.active_connections,
            idle: poolStats.idle_connections,
            waiting: poolStats.waiting_connections,
            total: 100
          }];
        });
      }

      // Simulate query changes
      if (Math.random() > 0.6) {
        setActiveQueries(prev => {
          const updated = prev.map(q => ({
            ...q,
            duration: Math.max(0.1, q.duration + (Math.random() - 0.5) * 0.5)
          }));
          return updated.filter(q => q.duration < 5); // Remove completed queries
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [poolStats]);

  const utilization = (poolStats.active_connections / poolStats.total_connections) * 100;
  const unresolvedAlerts = connectionAlerts.filter(a => !a.resolved);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Connection Pool Monitor</h2>
          <p className="text-slate-400 font-semibold">Real-time connection pooling & query analysis</p>
        </div>
        <div className="flex gap-2">
          {unresolvedAlerts.length > 0 && (
            <Button onClick={() => setShowAlertsDialog(true)} className="bg-amber-500 hover:bg-amber-600">
              <Bell className="w-4 h-4 mr-2" />
              {unresolvedAlerts.length} Alert{unresolvedAlerts.length > 1 ? 's' : ''}
            </Button>
          )}
          <Badge className={`${utilization > 80 ? 'bg-amber-500' : 'bg-green-500'} px-4 py-2 text-lg`}>
            {poolStats.health_status.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Real-time Pool Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">Active</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{poolStats.active_connections}</p>
            <p className="text-slate-400 text-sm font-semibold">Active Connections</p>
            <div className="mt-2">
              <Progress value={(poolStats.active_connections / poolStats.total_connections) * 100} className="h-2" />
            </div>
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
            <div className="mt-2">
              <Progress value={(poolStats.idle_connections / poolStats.total_connections) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-[#1a1f3a] border-0 ${poolStats.waiting_connections > 10 ? 'ring-2 ring-red-500' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
              <Badge className={poolStats.waiting_connections > 10 ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}>
                {poolStats.waiting_connections > 10 ? 'Critical' : 'Normal'}
              </Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{poolStats.waiting_connections}</p>
            <p className="text-slate-400 text-sm font-semibold">Waiting Requests</p>
            <p className="text-xs text-amber-400 mt-2">Avg wait: {poolStats.avg_wait_time.toFixed(0)}ms</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">Peak</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{poolStats.peak_connections}</p>
            <p className="text-slate-400 text-sm font-semibold">Peak Usage (24h)</p>
            <p className="text-xs text-purple-400 mt-2">{((poolStats.peak_connections / poolStats.total_connections) * 100).toFixed(0)}% capacity</p>
          </CardContent>
        </Card>
      </div>

      {/* Historical Connection Chart */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Connection Pool History (Real-time)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={historicalConnections}>
              <defs>
                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorIdle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend />
              <Area type="monotone" dataKey="active" stackId="1" stroke="#22c55e" fill="url(#colorActive)" name="Active" />
              <Area type="monotone" dataKey="idle" stackId="1" stroke="#06b6d4" fill="url(#colorIdle)" name="Idle" />
              <Line type="monotone" dataKey="waiting" stroke="#f59e0b" strokeWidth={2} name="Waiting" dot={{ fill: '#f59e0b', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pool Utilization Details */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Pool Utilization Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-400 text-sm">Total Usage</span>
                <span className="text-white font-bold">{utilization.toFixed(1)}%</span>
              </div>
              <Progress value={utilization} className="h-3" />
              {utilization > 80 && (
                <div className="mt-2 p-2 bg-amber-900/20 border border-amber-500/30 rounded">
                  <p className="text-amber-300 text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    High utilization - Consider scaling up
                  </p>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-200 text-sm font-semibold">Active</span>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-3xl font-black text-white">{poolStats.active_connections}</p>
                <p className="text-xs text-green-300 mt-1">
                  {((poolStats.active_connections / poolStats.total_connections) * 100).toFixed(0)}% of pool
                </p>
              </div>

              <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-cyan-200 text-sm font-semibold">Avg Wait</span>
                  <Clock className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-3xl font-black text-white">{poolStats.avg_wait_time.toFixed(0)}<span className="text-lg">ms</span></p>
                <p className="text-xs text-cyan-300 mt-1">Target: &lt; 50ms</p>
              </div>

              <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-200 text-sm font-semibold">Timeout</span>
                  <Server className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-3xl font-black text-white">{poolStats.connection_timeout}<span className="text-lg">s</span></p>
                <p className="text-xs text-purple-300 mt-1">Idle: {poolStats.idle_timeout}s</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Queries Monitor */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-400" />
              Active Queries ({activeQueries.length})
            </span>
            <Button size="sm" variant="outline" className="border-slate-700">
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {activeQueries.length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No active queries</p>
              </div>
            ) : (
              activeQueries.map((query) => (
                <div key={query.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={query.duration > 2 ? 'bg-red-500' : query.duration > 1 ? 'bg-amber-500' : 'bg-cyan-500'}>
                          {query.duration.toFixed(1)}s
                        </Badge>
                        <span className="text-slate-400 text-xs">{query.user}</span>
                        <Badge className="bg-purple-500 text-xs">{query.connection_id}</Badge>
                      </div>
                      <pre className="text-green-400 font-mono text-xs overflow-x-auto bg-slate-900 p-2 rounded">
                        {query.query}
                      </pre>
                    </div>
                  </div>
                  {query.duration > 2 && (
                    <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded">
                      <p className="text-red-300 text-xs flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Long-running query detected
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connection Alerts Dialog */}
      <Dialog open={showAlertsDialog} onOpenChange={setShowAlertsDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl flex items-center gap-2">
              <Bell className="w-6 h-6 text-amber-400" />
              Connection Pool Alerts
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {connectionAlerts.map((alert) => (
              <Card key={alert.id} className={`${alert.severity === 'critical' ? 'bg-red-900/20 border-red-500/30' : 'bg-amber-900/20 border-amber-500/30'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${alert.severity === 'critical' ? 'bg-red-500/20' : 'bg-amber-500/20'} flex items-center justify-center`}>
                      {alert.severity === 'critical' ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={alert.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <span className="text-slate-400 text-xs">{format(alert.timestamp, 'HH:mm:ss')}</span>
                      </div>
                      <p className="text-white font-semibold mb-2">{alert.message}</p>
                      <div className="p-2 bg-cyan-900/20 border border-cyan-500/30 rounded">
                        <p className="text-cyan-300 text-xs">
                          <Zap className="w-3 h-3 inline mr-1" />
                          Action: {alert.action}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}