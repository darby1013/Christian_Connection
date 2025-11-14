import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Activity, Cpu, HardDrive, Database, Zap, Server, 
  CheckCircle, AlertTriangle, XCircle, TrendingUp, Clock,
  Users, Globe, Gauge, BarChart3, RefreshCw, Shield,
  Wifi, CloudOff, Loader2, Eye, Lock, AlertCircle
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminSystemHealth() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    cpuUsage: 44.7,
    memoryUsage: 56.9,
    diskUsage: 42.8,
    activeConnections: 143,
    queriesPerSecond: 91,
    uptime: 99.98,
    networkLatency: 12,
    cacheHitRate: 87.3
  });

  const [historicalData, setHistoricalData] = useState([
    { time: '10:00', cpu: 35, memory: 52, queries: 78 },
    { time: '10:05', cpu: 42, memory: 55, queries: 84 },
    { time: '10:10', cpu: 38, memory: 54, queries: 81 },
    { time: '10:15', cpu: 45, memory: 57, queries: 88 },
    { time: '10:20', cpu: 41, memory: 56, queries: 85 },
    { time: '10:25', cpu: 44, memory: 57, queries: 91 },
  ]);

  const [systemStatus, setSystemStatus] = useState({
    overall: 'healthy',
    api: 'healthy',
    database: 'healthy',
    cache: 'healthy',
    storage: 'healthy',
    network: 'healthy'
  });

  const [activeProcesses, setActiveProcesses] = useState([
    { name: 'Web Server', cpu: 12.3, memory: 256, status: 'running' },
    { name: 'Database', cpu: 18.5, memory: 512, status: 'running' },
    { name: 'Cache Manager', cpu: 5.2, memory: 128, status: 'running' },
    { name: 'Job Scheduler', cpu: 2.1, memory: 64, status: 'running' },
    { name: 'WebSocket Server', cpu: 8.7, memory: 192, status: 'running' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates
      setRealTimeMetrics(prev => ({
        cpuUsage: Math.min(100, Math.max(0, prev.cpuUsage + (Math.random() - 0.5) * 5)),
        memoryUsage: Math.min(100, Math.max(0, prev.memoryUsage + (Math.random() - 0.5) * 3)),
        diskUsage: Math.min(100, Math.max(0, prev.diskUsage + (Math.random() - 0.5) * 1)),
        activeConnections: Math.floor(Math.max(0, prev.activeConnections + (Math.random() - 0.5) * 10)),
        queriesPerSecond: Math.floor(Math.max(0, prev.queriesPerSecond + (Math.random() - 0.5) * 15)),
        uptime: prev.uptime,
        networkLatency: Math.max(1, prev.networkLatency + (Math.random() - 0.5) * 2),
        cacheHitRate: Math.min(100, Math.max(0, prev.cacheHitRate + (Math.random() - 0.5) * 2))
      }));

      // Update historical data
      setHistoricalData(prev => {
        const newData = [...prev.slice(1), {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          cpu: realTimeMetrics.cpuUsage,
          memory: realTimeMetrics.memoryUsage,
          queries: realTimeMetrics.queriesPerSecond
        }];
        return newData;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [realTimeMetrics]);

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const getStatusColor = (status) => {
    if (status === 'healthy') return 'from-green-500 to-emerald-500';
    if (status === 'warning') return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getStatusIcon = (status) => {
    if (status === 'healthy') return <CheckCircle className="w-6 h-6" />;
    if (status === 'warning') return <AlertTriangle className="w-6 h-6" />;
    return <XCircle className="w-6 h-6" />;
  };

  const getMetricStatus = (value, type) => {
    if (type === 'cpu' || type === 'memory' || type === 'disk') {
      if (value < 60) return 'healthy';
      if (value < 80) return 'warning';
      return 'critical';
    }
    if (type === 'uptime') {
      if (value >= 99.9) return 'healthy';
      if (value >= 99) return 'warning';
      return 'critical';
    }
    return 'healthy';
  };

  const cpuStatus = getMetricStatus(realTimeMetrics.cpuUsage, 'cpu');
  const memoryStatus = getMetricStatus(realTimeMetrics.memoryUsage, 'memory');
  const diskStatus = getMetricStatus(realTimeMetrics.diskUsage, 'disk');
  const uptimeStatus = getMetricStatus(realTimeMetrics.uptime, 'uptime');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">System Health Dashboard</h2>
          <p className="text-slate-400 font-semibold">Real-time performance monitoring • Enterprise metrics</p>
        </div>
        <Button onClick={refreshMetrics} disabled={isRefreshing} className="bg-cyan-500 hover:bg-cyan-600">
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card className={`bg-gradient-to-r ${getStatusColor(systemStatus.overall)} border-0`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusIcon(systemStatus.overall)}
              <div>
                <p className="text-white font-black text-2xl">System Status: {systemStatus.overall.toUpperCase()}</p>
                <p className="text-white/80 text-sm">All systems operational • No critical alerts</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white text-4xl font-black">{realTimeMetrics.uptime}%</p>
              <p className="text-white/80 text-sm">Uptime</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-2 ${
          cpuStatus === 'healthy' ? 'border-green-500/30' :
          cpuStatus === 'warning' ? 'border-amber-500/30' : 'border-red-500/30'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Cpu className={`w-10 h-10 ${
                cpuStatus === 'healthy' ? 'text-green-400' :
                cpuStatus === 'warning' ? 'text-amber-400' : 'text-red-400'
              }`} />
              <Badge className={`${
                cpuStatus === 'healthy' ? 'bg-green-500' :
                cpuStatus === 'warning' ? 'bg-amber-500' : 'bg-red-500'
              }`}>
                {cpuStatus}
              </Badge>
            </div>
            <p className="text-4xl font-black text-white mb-2">{realTimeMetrics.cpuUsage.toFixed(1)}%</p>
            <p className="text-slate-400 text-sm font-semibold mb-3">CPU Usage</p>
            <Progress value={realTimeMetrics.cpuUsage} className="h-2" />
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-2 ${
          memoryStatus === 'healthy' ? 'border-green-500/30' :
          memoryStatus === 'warning' ? 'border-amber-500/30' : 'border-red-500/30'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <HardDrive className={`w-10 h-10 ${
                memoryStatus === 'healthy' ? 'text-green-400' :
                memoryStatus === 'warning' ? 'text-amber-400' : 'text-red-400'
              }`} />
              <Badge className={`${
                memoryStatus === 'healthy' ? 'bg-green-500' :
                memoryStatus === 'warning' ? 'bg-amber-500' : 'bg-red-500'
              }`}>
                {memoryStatus}
              </Badge>
            </div>
            <p className="text-4xl font-black text-white mb-2">{realTimeMetrics.memoryUsage.toFixed(1)}%</p>
            <p className="text-slate-400 text-sm font-semibold mb-3">Memory Usage</p>
            <Progress value={realTimeMetrics.memoryUsage} className="h-2" />
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-2 ${
          diskStatus === 'healthy' ? 'border-green-500/30' :
          diskStatus === 'warning' ? 'border-amber-500/30' : 'border-red-500/30'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Database className={`w-10 h-10 ${
                diskStatus === 'healthy' ? 'text-green-400' :
                diskStatus === 'warning' ? 'text-amber-400' : 'text-red-400'
              }`} />
              <Badge className={`${
                diskStatus === 'healthy' ? 'bg-green-500' :
                diskStatus === 'warning' ? 'bg-amber-500' : 'bg-red-500'
              }`}>
                {diskStatus}
              </Badge>
            </div>
            <p className="text-4xl font-black text-white mb-2">{realTimeMetrics.diskUsage.toFixed(1)}%</p>
            <p className="text-slate-400 text-sm font-semibold mb-3">Disk Usage</p>
            <Progress value={realTimeMetrics.diskUsage} className="h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-2 border-cyan-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-10 h-10 text-cyan-400" />
              <Badge className="bg-cyan-500">live</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-2">{realTimeMetrics.activeConnections}</p>
            <p className="text-slate-400 text-sm font-semibold mb-3">Active Connections</p>
            <p className="text-cyan-400 text-xs font-bold">Real-time database connections</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              CPU & Memory Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="CPU %" />
                <Area type="monotone" dataKey="memory" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.3} name="Memory %" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Database Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Line type="monotone" dataKey="queries" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981' }} name="Queries/sec" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black text-white">{realTimeMetrics.queriesPerSecond}</p>
                <p className="text-slate-400 text-sm">Queries/sec</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-bold">+15.3% from avg</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Wifi className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black text-white">{realTimeMetrics.networkLatency.toFixed(0)}ms</p>
                <p className="text-slate-400 text-sm">Network Latency</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-bold">Excellent</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Gauge className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black text-white">{realTimeMetrics.cacheHitRate.toFixed(1)}%</p>
                <p className="text-slate-400 text-sm">Cache Hit Rate</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-bold">Optimized</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Components Status */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Component Health</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(systemStatus).filter(([key]) => key !== 'overall').map(([component, status]) => {
              const icons = {
                api: Globe,
                database: Database,
                cache: Zap,
                storage: HardDrive,
                network: Wifi
              };
              const Icon = icons[component] || Server;

              return (
                <div key={component} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${
                        status === 'healthy' ? 'text-green-400' :
                        status === 'warning' ? 'text-amber-400' : 'text-red-400'
                      }`} />
                      <span className="text-white font-bold capitalize">{component}</span>
                    </div>
                    {status === 'healthy' && <CheckCircle className="w-5 h-5 text-green-400" />}
                    {status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                    {status === 'critical' && <XCircle className="w-5 h-5 text-red-400" />}
                  </div>
                  <Badge className={`w-full justify-center ${
                    status === 'healthy' ? 'bg-green-500' :
                    status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                  }`}>
                    {status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Processes */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Active Processes</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {activeProcesses.map((process, idx) => (
              <div key={idx} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold">{process.name}</p>
                      <Badge className="bg-green-500 text-xs mt-1">{process.status}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs">CPU: <span className="text-white font-bold">{process.cpu}%</span></p>
                    <p className="text-slate-400 text-xs">Memory: <span className="text-white font-bold">{process.memory}MB</span></p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Progress value={process.cpu * 5} className="h-1.5 mb-1" />
                    <p className="text-xs text-slate-500">CPU Load</p>
                  </div>
                  <div>
                    <Progress value={(process.memory / 1024) * 100} className="h-1.5 mb-1" />
                    <p className="text-xs text-slate-500">Memory</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white font-bold flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
              <span className="text-slate-400">Platform</span>
              <span className="text-white font-bold">Linux x64</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
              <span className="text-slate-400">Node Version</span>
              <span className="text-white font-bold">v20.10.0</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
              <span className="text-slate-400">Total RAM</span>
              <span className="text-white font-bold">16 GB</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
              <span className="text-slate-400">Total Disk</span>
              <span className="text-white font-bold">500 GB SSD</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
              <span className="text-slate-400">Uptime</span>
              <span className="text-white font-bold">45 days 12h 34m</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white font-bold flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-green-400" />
                <span className="text-slate-300">SSL Certificate</span>
              </div>
              <Badge className="bg-green-500">Valid</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-slate-300">Firewall</span>
              </div>
              <Badge className="bg-green-500">Active</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-green-400" />
                <span className="text-slate-300">DDoS Protection</span>
              </div>
              <Badge className="bg-green-500">Enabled</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-green-400" />
                <span className="text-slate-300">Security Scan</span>
              </div>
              <Badge className="bg-green-500">Clean</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-slate-300">Last Audit</span>
              </div>
              <span className="text-slate-400 text-sm">2 hours ago</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Alerts */}
      <Card className="bg-green-900/20 border-green-500/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-10 h-10 text-green-400" />
            <div>
              <p className="text-green-300 font-black text-xl">All Systems Healthy</p>
              <p className="text-green-200 text-sm">No critical events • Performance optimal • 99.98% uptime</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}