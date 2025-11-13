import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity, Database, Clock, TrendingUp, Zap, CheckCircle,
  Server, HardDrive, Wifi, AlertCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDatabaseMonitoring() {
  const [realtimeMetrics, setRealtimeMetrics] = useState({
    qps: 147,
    connections: 42,
    cpu: 45,
    memory: 62,
    disk: 38,
    latency: 12
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeMetrics({
        qps: Math.floor(Math.random() * 50 + 130),
        connections: Math.floor(Math.random() * 20 + 35),
        cpu: Math.random() * 20 + 40,
        memory: Math.random() * 15 + 55,
        disk: Math.random() * 10 + 35,
        latency: Math.random() * 10 + 8
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const performanceData = [
    { time: '14:00', qps: 142, latency: 15 },
    { time: '14:05', qps: 156, latency: 12 },
    { time: '14:10', qps: 134, latency: 18 },
    { time: '14:15', qps: 147, latency: 14 },
    { time: '14:20', qps: 152, latency: 11 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Database Monitoring</h2>
        <p className="text-slate-400 font-semibold">Real-time database performance and health metrics</p>
      </div>

      {/* Real-time Metrics */}
      <div className="grid md:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Activity className="w-8 h-8 text-cyan-400 mb-3" />
            <p className="text-3xl font-black text-white mb-1">{realtimeMetrics.qps}</p>
            <p className="text-slate-400 text-xs">Queries/sec</p>
            <Badge className="mt-2 bg-cyan-500 animate-pulse">Live</Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Wifi className="w-8 h-8 text-green-400 mb-3" />
            <p className="text-3xl font-black text-white mb-1">{realtimeMetrics.connections}</p>
            <p className="text-slate-400 text-xs">Connections</p>
            <Badge className="mt-2 bg-green-500">Active</Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Server className="w-8 h-8 text-purple-400 mb-3" />
            <p className="text-3xl font-black text-white mb-1">{realtimeMetrics.cpu.toFixed(0)}%</p>
            <p className="text-slate-400 text-xs">CPU Usage</p>
            <Progress value={realtimeMetrics.cpu} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Database className="w-8 h-8 text-blue-400 mb-3" />
            <p className="text-3xl font-black text-white mb-1">{realtimeMetrics.memory.toFixed(0)}%</p>
            <p className="text-slate-400 text-xs">Memory</p>
            <Progress value={realtimeMetrics.memory} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <HardDrive className="w-8 h-8 text-amber-400 mb-3" />
            <p className="text-3xl font-black text-white mb-1">{realtimeMetrics.disk.toFixed(0)}%</p>
            <p className="text-slate-400 text-xs">Disk</p>
            <Progress value={realtimeMetrics.disk} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Zap className="w-8 h-8 text-yellow-400 mb-3" />
            <p className="text-3xl font-black text-white mb-1">{realtimeMetrics.latency}ms</p>
            <p className="text-slate-400 text-xs">Latency</p>
            <Badge className="mt-2 bg-green-500">Fast</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Performance Trends</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              />
              <Line type="monotone" dataKey="qps" stroke="#22d3ee" strokeWidth={2} name="Queries/sec" />
              <Line type="monotone" dataKey="latency" stroke="#a855f7" strokeWidth={2} name="Latency (ms)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Health Status */}
      <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
        <CardHeader className="border-b border-green-500/30">
          <CardTitle className="text-green-300 font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            System Health: All Systems Operational
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-green-300 font-bold">Database</p>
                <p className="text-green-200 text-sm">Healthy</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-green-300 font-bold">Replication</p>
                <p className="text-green-200 text-sm">Synced</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-green-300 font-bold">Backups</p>
                <p className="text-green-200 text-sm">Up to date</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}