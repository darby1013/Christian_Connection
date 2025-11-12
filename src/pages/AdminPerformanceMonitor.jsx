import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity, Zap, Clock, TrendingUp, AlertTriangle,
  Database, RefreshCw, Download, BarChart3
} from "lucide-react";

export default function AdminPerformanceMonitor() {
  const [refreshing, setRefreshing] = useState(false);

  const slowQueries = [
    {
      query: 'SELECT * FROM Product WHERE category = ? ORDER BY created_date DESC',
      avg_time: 2.5,
      executions: 1250,
      table: 'Product',
      recommendation: 'Add index on (category, created_date)'
    },
    {
      query: 'SELECT o.*, u.email FROM Order o JOIN User u ON o.customer_id = u.id WHERE status = ?',
      avg_time: 1.8,
      executions: 890,
      table: 'Order',
      recommendation: 'Already optimized with indexes'
    },
    {
      query: 'SELECT COUNT(*) FROM ProductReview WHERE product_id = ?',
      avg_time: 1.2,
      executions: 5600,
      table: 'ProductReview',
      recommendation: 'Cache this value in Product table'
    }
  ];

  const tableStats = [
    { name: 'Product', rows: 1250, size: '45.2 MB', growth: '+2.1%', queries: 25600 },
    { name: 'Order', rows: 8900, size: '128.5 MB', growth: '+5.8%', queries: 15200 },
    { name: 'CustomerLoyalty', rows: 450, size: '8.3 MB', growth: '+1.2%', queries: 3400 },
    { name: 'ProductReview', rows: 3200, size: '22.1 MB', growth: '+3.5%', queries: 8900 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Performance Monitor</h2>
          <p className="text-slate-400 font-semibold">Real-time database performance metrics</p>
        </div>
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

      {/* Performance Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">Healthy</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">98.5%</p>
            <p className="text-slate-400 text-sm font-semibold">Uptime</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">Fast</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">45ms</p>
            <p className="text-slate-400 text-sm font-semibold">Avg Query Time</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-8 h-8 text-purple-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">52,400</p>
            <p className="text-slate-400 text-sm font-semibold">Queries/Hour</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
              <Badge className="bg-amber-500">Warning</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">3</p>
            <p className="text-slate-400 text-sm font-semibold">Slow Queries</p>
          </CardContent>
        </Card>
      </div>

      {/* Slow Query Log */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Slow Query Log (> 1 second)
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
                      <Badge className="bg-amber-500">{query.avg_time}s avg</Badge>
                      <Badge className="bg-purple-500">{query.table}</Badge>
                      <span className="text-slate-400 text-sm">{query.executions.toLocaleString()} executions</span>
                    </div>
                    <pre className="text-green-400 font-mono text-xs bg-slate-900 p-3 rounded border border-slate-700 overflow-x-auto">
                      {query.query}
                    </pre>
                  </div>
                </div>
                <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                  <p className="text-cyan-300 text-sm font-bold">
                    💡 Recommendation: {query.recommendation}
                  </p>
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
            Table Statistics
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
                      <Badge className="bg-green-500 text-xs">{table.growth}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white">{table.queries.toLocaleString()}</p>
                    <p className="text-slate-400 text-xs">queries/day</p>
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (table.queries / 300) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}