import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  CheckCircle, XCircle, AlertTriangle, TrendingUp, Database,
  Eye, Play, Shield
} from "lucide-react";

export default function AdminDataQuality() {
  const qualityMetrics = [
    { name: 'Completeness', score: 94, status: 'good', issues: 237 },
    { name: 'Accuracy', score: 98, status: 'excellent', issues: 42 },
    { name: 'Consistency', score: 87, status: 'warning', issues: 521 },
    { name: 'Timeliness', score: 92, status: 'good', issues: 186 },
  ];

  const dataIssues = [
    { table: 'Product', issue: 'Missing descriptions', count: 47, severity: 'medium' },
    { table: 'User', issue: 'Invalid email formats', count: 12, severity: 'high' },
    { table: 'Order', issue: 'Orphaned records', count: 8, severity: 'high' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Data Quality Monitor</h2>
          <p className="text-slate-400 font-semibold">Assess and improve data quality across your database</p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600">
          <Play className="w-4 h-4 mr-2" />
          Run Quality Scan
        </Button>
      </div>

      {/* Overall Score */}
      <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
        <CardContent className="p-8 text-center">
          <div className="inline-block">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4">
              <div className="text-center">
                <p className="text-white text-5xl font-black">93</p>
                <p className="text-white text-sm font-bold">Score</p>
              </div>
            </div>
            <p className="text-green-300 font-bold text-xl mb-2">Excellent Data Quality</p>
            <p className="text-green-200 text-sm">Your database is in great shape!</p>
          </div>
        </CardContent>
      </Card>

      {/* Quality Dimensions */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Quality Dimensions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {qualityMetrics.map((metric, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h4 className="text-white font-bold">{metric.name}</h4>
                    <Badge className={
                      metric.status === 'excellent' ? 'bg-green-500' :
                      metric.status === 'good' ? 'bg-cyan-500' :
                      'bg-yellow-500'
                    }>
                      {metric.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{metric.score}%</span>
                    <span className="text-slate-400 text-sm">({metric.issues} issues)</span>
                  </div>
                </div>
                <Progress value={metric.score} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Issues */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Detected Issues</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {dataIssues.map((issue, idx) => (
              <Card key={idx} className={`bg-slate-900/50 ${issue.severity === 'high' ? 'border-red-500/30' : 'border-slate-700'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`w-6 h-6 ${issue.severity === 'high' ? 'text-red-400' : 'text-yellow-400'}`} />
                      <div>
                        <h4 className="text-white font-bold">{issue.table}</h4>
                        <p className="text-slate-400 text-sm">{issue.issue}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={issue.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'}>
                        {issue.count} records
                      </Badge>
                      <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                        <Eye className="w-3 h-3 mr-1" />
                        Fix
                      </Button>
                    </div>
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