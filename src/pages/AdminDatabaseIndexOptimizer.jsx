import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Zap, TrendingUp, Database, CheckCircle, AlertTriangle,
  Activity, Plus, Settings, Eye, RefreshCw
} from "lucide-react";

export default function AdminDatabaseIndexOptimizer() {
  const indexes = [
    { table: 'Product', column: 'category', usage: 94, efficiency: 98, recommendation: 'Optimal' },
    { table: 'Order', column: 'customer_id', usage: 87, efficiency: 95, recommendation: 'Good' },
    { table: 'Product', column: 'price', usage: 45, efficiency: 72, recommendation: 'Consider composite index' },
    { table: 'User', column: 'email', usage: 99, efficiency: 100, recommendation: 'Optimal' },
  ];

  const suggestions = [
    { table: 'Product', suggested: 'CREATE INDEX idx_product_featured ON Product(is_featured, created_date)', impact: 'High', performance: '+45%' },
    { table: 'Order', suggested: 'CREATE INDEX idx_order_status_date ON Order(status, created_date)', impact: 'Medium', performance: '+28%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Index Optimizer</h2>
        <p className="text-slate-400 font-semibold">Analyze and optimize database indexes for maximum performance</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Database className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{indexes.length}</p>
            <p className="text-slate-400 text-sm">Active Indexes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">91%</p>
            <p className="text-slate-400 text-sm">Avg Efficiency</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Zap className="w-10 h-10 text-yellow-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{suggestions.length}</p>
            <p className="text-slate-400 text-sm">Suggestions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <TrendingUp className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">+35%</p>
            <p className="text-slate-400 text-sm">Potential Gain</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Indexes */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Current Indexes</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {indexes.map((index, idx) => (
              <Card key={idx} className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-bold">{index.table}.{index.column}</h4>
                      <p className="text-slate-400 text-sm">{index.recommendation}</p>
                    </div>
                    <Badge className={index.efficiency > 90 ? 'bg-green-500' : 'bg-yellow-500'}>
                      {index.efficiency}% efficient
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="text-slate-400">Usage</span>
                        <span className="text-white font-bold">{index.usage}%</span>
                      </div>
                      <Progress value={index.usage} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="text-slate-400">Efficiency</span>
                        <span className="text-white font-bold">{index.efficiency}%</span>
                      </div>
                      <Progress value={index.efficiency} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30">
        <CardHeader className="border-b border-purple-500/30">
          <CardTitle className="text-purple-300 font-bold flex items-center gap-2">
            <Zap className="w-5 h-5" />
            AI-Powered Optimization Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {suggestions.map((suggestion, idx) => (
              <Card key={idx} className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-white font-bold">{suggestion.table}</h4>
                        <Badge className="bg-cyan-500">{suggestion.impact} Impact</Badge>
                        <Badge className="bg-green-500">{suggestion.performance}</Badge>
                      </div>
                      <code className="text-green-400 text-xs bg-slate-900 p-2 rounded block">
                        {suggestion.suggested}
                      </code>
                    </div>
                  </div>
                  <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                    <Plus className="w-3 h-3 mr-1" />
                    Apply Suggestion
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}