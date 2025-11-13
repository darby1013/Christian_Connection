import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle, XCircle, TrendingDown, Activity, Clock,
  Code, FileText, CheckCircle, AlertTriangle
} from "lucide-react";

export default function AdminErrorTracking() {
  const errors = [
    {
      id: '1',
      message: 'Database connection timeout',
      stack: 'Error: Connection timeout at line 42...',
      occurrences: 23,
      lastSeen: '5 minutes ago',
      severity: 'high',
      status: 'unresolved'
    },
    {
      id: '2',
      message: 'Invalid API response format',
      stack: 'TypeError: Cannot read property...',
      occurrences: 7,
      lastSeen: '2 hours ago',
      severity: 'medium',
      status: 'investigating'
    },
  ];

  const stats = {
    total: 847,
    today: 42,
    resolved: 805,
    critical: 2
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Error Tracking</h2>
        <p className="text-slate-400 font-semibold">Monitor and debug application errors in real-time</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{stats.total}</p>
            <p className="text-slate-400 text-sm">Total Errors</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Activity className="w-10 h-10 text-orange-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{stats.today}</p>
            <p className="text-slate-400 text-sm">Today</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{stats.resolved}</p>
            <p className="text-slate-400 text-sm">Resolved</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <XCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{stats.critical}</p>
            <p className="text-slate-400 text-sm">Critical</p>
          </CardContent>
        </Card>
      </div>

      {/* Errors List */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Recent Errors</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {errors.map(error => (
              <Card key={error.id} className="bg-red-900/20 border-red-500/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-white font-bold">{error.message}</h4>
                        <Badge className="bg-red-500">{error.severity}</Badge>
                        <Badge className="bg-slate-700">{error.status}</Badge>
                      </div>
                      <p className="text-red-200 text-sm mb-2">{error.occurrences} occurrences • Last seen: {error.lastSeen}</p>
                      <details className="text-slate-400 text-xs">
                        <summary className="cursor-pointer hover:text-white">View stack trace</summary>
                        <pre className="mt-2 p-2 bg-slate-900 rounded overflow-x-auto">{error.stack}</pre>
                      </details>
                    </div>
                    <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                      Resolve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}