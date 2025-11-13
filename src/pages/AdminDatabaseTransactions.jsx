import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity, CheckCircle, Clock, RefreshCw, XCircle,
  TrendingUp, Database, Zap
} from "lucide-react";

export default function AdminDatabaseTransactions() {
  const activeTransactions = [
    { id: 'txn_001', type: 'UPDATE', table: 'Product', duration: '1.2s', status: 'active', rows: 247 },
    { id: 'txn_002', type: 'INSERT', table: 'Order', duration: '0.5s', status: 'active', rows: 1 },
  ];

  const stats = {
    active: 2,
    completed: 18473,
    rolled_back: 42,
    avg_duration: '0.45s'
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Transaction Monitor</h2>
        <p className="text-slate-400 font-semibold">Real-time database transaction monitoring</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Activity className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{stats.active}</p>
            <p className="text-slate-400 text-sm">Active Now</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{stats.completed.toLocaleString()}</p>
            <p className="text-slate-400 text-sm">Completed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <RefreshCw className="w-10 h-10 text-orange-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{stats.rolled_back}</p>
            <p className="text-slate-400 text-sm">Rolled Back</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Clock className="w-10 h-10 text-purple-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{stats.avg_duration}</p>
            <p className="text-slate-400 text-sm">Avg Duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Transactions */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Active Transactions
            <Badge className="ml-auto bg-cyan-500 animate-pulse">Live</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {activeTransactions.map(txn => (
              <Card key={txn.id} className="bg-slate-900/50 border-cyan-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <code className="text-white font-mono font-bold">{txn.id}</code>
                        <Badge className="bg-cyan-500">{txn.type}</Badge>
                      </div>
                      <p className="text-slate-400 text-sm">Table: {txn.table} • {txn.rows} rows</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{txn.duration}</p>
                      <Badge className="bg-green-500 mt-1">In Progress</Badge>
                    </div>
                  </div>
                  <Progress value={75} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}