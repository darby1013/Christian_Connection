import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Activity, Zap, Clock, TrendingUp, AlertTriangle,
  Database, RefreshCw, Download, BarChart3, Bell,
  XCircle, CheckCircle, TrendingDown
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

export default function AdminPerformanceMonitor() {
  const [refreshing, setRefreshing] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [realTimeData, setRealTimeData] = useState({
    queryTime: 45,
    queriesPerHour: 52400,
    activeConnections: 45,
    uptime: 98.5
  });

  // Historical data for charts
  const [historicalData, setHistoricalData] = useState([
    { time: '10:00', queries: 48000, avgTime: 42, connections: 38 },
    { time: '11:00', queries: 51000, avgTime: 45, connections: 42 },
    { time: '12:00', queries: 55000, avgTime: 48, connections: 48 },
    { time: '13:00', queries: 52000, avgTime: 44, connections: 45 },
    { time: '14:00', queries: 52400, avgTime: 45, connections: 45 }
  ]);

  const [alerts, setAlerts] = useState([
    {
      id: 1,
      severity: 'critical',
      type: 'slow_query',
      message: 'Query on Product table exceeding 2s threshold',
      query: 'SELECT * FROM Product WHERE category = ? ORDER BY created_date DESC',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      resolved: false
    },
    {
      id: 2,
      severity: 'warning',
      type: 'high_utilization',
      message: 'Connection pool utilization at 85%',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      resolved: false
    },
    {
      id: 3,
      severity: 'info',
      type: 'optimization',
      message: 'Suggested index created on Order(customer_id, created_date)',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      resolved: true
    }
  ]);

  const slowQueries = [
    {
      query: 'SELECT * FROM Product WHERE category = ? ORDER BY created_date DESC',
      avg_time: 2.5,
      executions: 1250,
      table: 'Product',
      recommendation: 'Add composite index: CREATE INDEX idx_cat_date ON Product(category, created_date DESC);',
      impact: 'High - 1,250 daily executions'
    },
    {
      query: 'SELECT o.*, u.email FROM Order o JOIN User u ON o.customer_id = u.id WHERE status = ?',
      avg_time: 1.8,
      executions: 890,
      table: 'Order',
      recommendation: 'Index already exists on status field',
      impact: 'Medium - 890 daily executions'
    },
    {
      query: 'SELECT COUNT(*) FROM ProductReview WHERE product_id = ? AND is_approved = true',
      avg_time: 1.2,
      executions: 5600,
      table: 'ProductReview',
      recommendation: 'Cache review_count in Product table to avoid real-time COUNT()',
      impact: 'Critical - 5,600 daily executions'
    },
    {
      query: 'SELECT * FROM Inventory WHERE product_id IN (?) AND warehouse_location = ?',
      avg_time: 1.5,
      executions: 2100,
      table: 'Inventory',
      recommendation: 'Add composite index: CREATE INDEX idx_prod_warehouse ON Inventory(product_id, warehouse_location);',
      impact: 'High - 2,100 daily executions'
    }
  ];

  const tableStats = [
    { name: 'Product', rows: 1250, size: '45.2 MB', growth: '+2.1%', queries: 25600, cacheHit: 92 },
    { name: 'Order', rows: 8900, size: '128.5 MB', growth: '+5.8%', queries: 15200, cacheHit: 88 },
    { name: 'CustomerLoyalty', rows: 450, size: '8.3 MB', growth: '+1.2%', queries: 3400, cacheHit: 95 },
    { name: 'ProductReview', rows: 3200, size: '22.1 MB', growth: '+3.5%', queries: 8900, cacheHit: 85 },
    { name: 'Inventory', rows: 1850, size: '15.7 MB', growth: '+1.8%', queries: 6200, cacheHit: 90 }
  ];

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        queryTime: prev.queryTime + (Math.random() - 0.5) * 5,
        queriesPerHour: prev.queriesPerHour + Math.floor((Math.random() - 0.5) * 1000),
        activeConnections: Math.max(20, Math.min(80, prev.activeConnections + Math.floor((Math.random() - 0.5) * 5))),
        uptime: 98.5
      }));

      // Add new data point every 5 minutes
      if (Math.random() > 0.7) {
        setHistoricalData(prev => {
          const now = format(new Date(), 'HH:mm');
          const newData = [...prev.slice(-11), {
            time: now,
            queries: realTimeData.queriesPerHour,
            avgTime: realTimeData.queryTime,
            connections: realTimeData.activeConnections
          }];
          return newData;
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [realTimeData]);

  const unresolvedAlerts = alerts.filter(a => !a.resolved);
  const criticalAlerts = unresolvedAlerts.filter(a => a.severity === 'critical');

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-amber-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  const getSeverityIcon = (severity) => {
    switch(severity) {
      case 'critical': return <XCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'info': return <CheckCircle className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Performance Monitor</h2>
          <p className="text-slate-400 font-semibold">Real-time database performance & health monitoring</p>
        </div>
        <div className="flex gap-2">
          {criticalAlerts.length > 0 && (
            <Button
              onClick={() => setShowAlerts(true)}
              className="bg-red-500 hover:bg-red-600 animate-pulse"
            >
              <Bell className="w-4 h-4 mr-2" />
              {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''}
            </Button>
          )}
          <Button
            onClick={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 1000);
            }}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">Healthy</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{realTimeData.uptime.toFixed(1)}%</p>
            <p className="text-slate-400 text-sm font-semibold">Uptime (30 days)</p>
          </CardContent>
        </Card>

        <Card className={`bg-[#1a1f3a] border-0 ${realTimeData.queryTime > 100 ? 'ring-2 ring-red-500' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 text-cyan-400" />
              <Badge className={realTimeData.queryTime > 100 ? "bg-red-500 animate-pulse" : "bg-cyan-500"}>
                {realTimeData.queryTime > 100 ? 'Slow' : 'Fast'}
              </Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{realTimeData.queryTime.toFixed(0)}ms</p>
            <p className="text-slate-400 text-sm font-semibold">Avg Query Time</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-8 h-8 text-purple-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{realTimeData.queriesPerHour.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Queries/Hour</p>
          </CardContent>
        </Card>

        <Card className={`bg-[#1a1f3a] border-0 ${realTimeData.activeConnections > 70 ? 'ring-2 ring-amber-500' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-amber-400" />
              <Badge className={realTimeData.activeConnections > 70 ? "bg-amber-500 animate-pulse" : "bg-green-500"}>
                {realTimeData.activeConnections > 70 ? 'High' : 'Normal'}
              </Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{realTimeData.activeConnections}/100</p>
            <p className="text-slate-400 text-sm font-semibold">Active Connections</p>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Query Performance (Last 5 Hours)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Area type="monotone" dataKey="queries" stroke="#06b6d4" fillOpacity={1} fill="url(#colorQueries)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              Average Query Time (Last 5 Hours)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Line type="monotone" dataKey="avgTime" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Connection Pool Chart */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            Connection Pool Utilization
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={historicalData}>
              <defs>
                <linearGradient id="colorConnections" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Area type="monotone" dataKey="connections" stroke="#22c55e" fillOpacity={1} fill="url(#colorConnections)" />
              {/* Alert threshold line */}
              <Line type="monotone" dataKey={() => 80} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-center">
            <Badge className="bg-amber-500">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Alert threshold: 80 connections
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Slow Query Log */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Slow Query Analysis (&gt; 1 second)
            </span>
            <Button size="sm" variant="outline" className="border-slate-700">
              <Download className="w-3 h-3 mr-1" />
              Export Log
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-700">
            {slowQueries.map((query, idx) => (
              <div key={idx} className="p-6 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={query.avg_time > 2 ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}>
                        {query.avg_time}s avg
                      </Badge>
                      <Badge className="bg-purple-500">{query.table}</Badge>
                      <span className="text-slate-400 text-sm">{query.executions.toLocaleString()} executions/day</span>
                      <Badge className={
                        query.impact.startsWith('Critical') ? 'bg-red-500' :
                        query.impact.startsWith('High') ? 'bg-amber-500' : 'bg-blue-500'
                      }>
                        {query.impact}
                      </Badge>
                    </div>
                    <pre className="text-green-400 font-mono text-xs bg-slate-900 p-3 rounded border border-slate-700 overflow-x-auto mb-3">
                      {query.query}
                    </pre>
                    <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                      <p className="text-cyan-300 text-sm">
                        <Zap className="w-4 h-4 inline mr-1" />
                        <strong>Optimization:</strong> {query.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table Statistics */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Table Performance Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {tableStats.map((table, idx) => (
              <div key={idx} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-bold text-lg">{table.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                      <span>{table.rows.toLocaleString()} rows</span>
                      <span>{table.size}</span>
                      <Badge className={table.growth.startsWith('+') ? 'bg-green-500' : 'bg-red-500'} size="sm">
                        {table.growth}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white">{table.queries.toLocaleString()}</p>
                    <p className="text-slate-400 text-xs">queries/day</p>
                    <Badge className="bg-cyan-500 text-xs mt-1">
                      {table.cacheHit}% cache hit
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Query Load</span>
                    <span>{Math.min(100, (table.queries / 300)).toFixed(0)}%</span>
                  </div>
                  <Progress value={Math.min(100, (table.queries / 300))} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts Dialog */}
      <Dialog open={showAlerts} onOpenChange={setShowAlerts}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl flex items-center gap-2">
              <Bell className="w-6 h-6 text-red-400" />
              Performance Alerts ({unresolvedAlerts.length} Active)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className={`${getSeverityColor(alert.severity)}/10 border-${alert.severity === 'critical' ? 'red' : alert.severity === 'warning' ? 'amber' : 'blue'}-500/30`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg ${getSeverityColor(alert.severity)}/20 flex items-center justify-center`}>
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge className="bg-purple-500 text-xs">{alert.type.replace('_', ' ')}</Badge>
                        {alert.resolved && <Badge className="bg-green-500 text-xs">Resolved</Badge>}
                      </div>
                      <h4 className="text-white font-bold mb-1">{alert.message}</h4>
                      {alert.query && (
                        <pre className="text-green-400 font-mono text-xs bg-slate-900 p-2 rounded mt-2 overflow-x-auto">
                          {alert.query}
                        </pre>
                      )}
                      <p className="text-slate-400 text-xs mt-2">
                        {format(alert.timestamp, 'MMM d, yyyy HH:mm:ss')}
                      </p>
                    </div>
                    {!alert.resolved && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setAlerts(alerts.map(a => a.id === alert.id ? {...a, resolved: true} : a));
                        }}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Resolve
                      </Button>
                    )}
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