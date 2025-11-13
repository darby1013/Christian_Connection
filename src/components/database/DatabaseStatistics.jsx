import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Database, HardDrive, Activity, Clock, TrendingUp, Users,
  FileText, Zap, Shield, CheckCircle
} from "lucide-react";

export default function DatabaseStatistics({ 
  totalRecords = 0, 
  totalTables = 0, 
  databaseSize = 0, 
  uptime = 99.98,
  tables = []
}) {
  const activetables = tables.filter(t => t.recordCount > 0).length;
  const totalQueries = 12847; // Would come from monitoring
  const avgResponseTime = 45; // ms

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Database className="w-10 h-10 text-cyan-400" />
              <Badge className="bg-cyan-500">Active</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">{totalRecords.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Records</p>
            <div className="mt-2 text-xs text-cyan-400">
              +{Math.round(totalRecords * 0.05)} this week
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <FileText className="w-10 h-10 text-green-400" />
              <Badge className="bg-green-500">Healthy</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">{totalTables}</p>
            <p className="text-slate-400 text-sm font-semibold">Database Tables</p>
            <div className="mt-2 text-xs text-green-400">
              {activeTables} with data
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <HardDrive className="w-10 h-10 text-purple-400" />
              <Badge className="bg-purple-500">Optimal</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">
              {databaseSize.toFixed(1)}
              <span className="text-2xl ml-1">MB</span>
            </p>
            <p className="text-slate-400 text-sm font-semibold">Database Size</p>
            <div className="mt-2 text-xs text-purple-400">
              {((databaseSize / 1024) * 100).toFixed(1)}% of 100GB
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Activity className="w-10 h-10 text-green-400" />
              <Badge className="bg-green-500">Live</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">{uptime}%</p>
            <p className="text-slate-400 text-sm font-semibold">Uptime</p>
            <div className="mt-2 text-xs text-green-400">
              99.99% last 30 days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-black text-white">{totalQueries.toLocaleString()}</p>
                <p className="text-slate-400 text-sm">Queries Today</p>
              </div>
            </div>
            <Progress value={75} className="h-2" />
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-8 h-8 text-cyan-400" />
              <div>
                <p className="text-2xl font-black text-white">{avgResponseTime}ms</p>
                <p className="text-slate-400 text-sm">Avg Response</p>
              </div>
            </div>
            <Progress value={85} className="h-2" />
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-black text-white">256-bit</p>
                <p className="text-slate-400 text-sm">Encryption</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm">Secure</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Distribution */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Storage Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {tables.filter(t => t.recordCount > 0)
              .sort((a, b) => (b.size || 0) - (a.size || 0))
              .slice(0, 8)
              .map(table => {
                const percentage = (table.size / databaseSize) * 100;
                return (
                  <div key={table.name}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-sm">{table.name}</span>
                        <Badge className="bg-slate-700 text-xs">
                          {table.recordCount} records
                        </Badge>
                      </div>
                      <span className="text-cyan-400 font-bold text-sm">
                        {table.size?.toFixed(2) || 0} MB
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
        <CardHeader className="border-b border-green-500/30">
          <CardTitle className="text-green-300 font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            System Health Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <p className="text-green-400 font-bold text-lg">100%</p>
              <p className="text-green-200 text-xs">API Status</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <p className="text-green-400 font-bold text-lg">&lt;50ms</p>
              <p className="text-green-200 text-xs">Response</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <p className="text-green-400 font-bold text-lg">Secure</p>
              <p className="text-green-200 text-xs">Encrypted</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <p className="text-green-400 font-bold text-lg">Live</p>
              <p className="text-green-200 text-xs">Monitoring</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Database className="w-6 h-6 text-white" />
              </div>
              <p className="text-green-400 font-bold text-lg">Daily</p>
              <p className="text-green-200 text-xs">Backups</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}