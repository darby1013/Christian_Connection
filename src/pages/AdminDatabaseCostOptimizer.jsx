import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign, TrendingDown, TrendingUp, Database, Zap,
  HardDrive, Activity, CheckCircle, AlertTriangle
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDatabaseCostOptimizer() {
  const costs = {
    current: 487.32,
    projected: 412.15,
    savings: 75.17,
    breakdown: [
      { name: 'Storage', value: 245, color: '#22d3ee' },
      { name: 'Compute', value: 167, color: '#a855f7' },
      { name: 'Backups', value: 52, color: '#10b981' },
      { name: 'Network', value: 23, color: '#f59e0b' },
    ]
  };

  const optimizations = [
    { suggestion: 'Archive old orders', savings: '$45/month', impact: 'Medium', status: 'recommended' },
    { suggestion: 'Enable compression', savings: '$20/month', impact: 'Low', status: 'recommended' },
    { suggestion: 'Optimize indexes', savings: '$10/month', impact: 'Low', status: 'applied' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Database Cost Optimizer</h2>
        <p className="text-slate-400 font-semibold">Reduce costs with AI-powered optimization suggestions</p>
      </div>

      {/* Cost Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <DollarSign className="w-10 h-10 text-blue-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">${costs.current}</p>
            <p className="text-slate-400 text-sm">Current Monthly Cost</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
          <CardContent className="p-6">
            <TrendingDown className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-green-400 mb-1">${costs.projected}</p>
            <p className="text-green-200 text-sm">Projected Cost</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
          <CardContent className="p-6">
            <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-green-400 mb-1">${costs.savings}</p>
            <p className="text-green-200 text-sm">Potential Savings</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white font-bold">Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={costs.breakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} $${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costs.breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white font-bold">Cost Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {costs.breakdown.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <span className="text-white font-bold">{item.name}</span>
                    <span className="text-cyan-400 font-bold">${item.value}/mo</span>
                  </div>
                  <Progress value={(item.value / costs.current) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Suggestions */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Cost Optimization Suggestions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {optimizations.map((opt, idx) => (
              <Card key={idx} className={`bg-slate-900/50 ${opt.status === 'recommended' ? 'border-green-500/30' : 'border-slate-700'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {opt.status === 'recommended' ? (
                        <AlertTriangle className="w-6 h-6 text-green-400" />
                      ) : (
                        <CheckCircle className="w-6 h-6 text-cyan-400" />
                      )}
                      <div>
                        <h4 className="text-white font-bold">{opt.suggestion}</h4>
                        <p className="text-slate-400 text-sm">Impact: {opt.impact}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-500">{opt.savings}</Badge>
                      {opt.status === 'recommended' && (
                        <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                          Apply
                        </Button>
                      )}
                      {opt.status === 'applied' && (
                        <Badge className="bg-cyan-500">Applied</Badge>
                      )}
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