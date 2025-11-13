import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GitCompare, CheckCircle, XCircle, AlertTriangle, Database,
  ArrowRight, Eye, Download
} from "lucide-react";

export default function AdminDatabaseComparison() {
  const differences = [
    { table: 'Product', field: 'price', env1: '29.99', env2: '24.99', status: 'different' },
    { table: 'User', field: 'count', env1: '5842', env2: '5840', status: 'different' },
    { table: 'Order', field: 'schema', env1: 'v2.5', env2: 'v2.4', status: 'schema_diff' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Database Comparison</h2>
        <p className="text-slate-400 font-semibold">Compare databases across environments</p>
      </div>

      {/* Environment Selection */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-[#1a1f3a] border-cyan-500/30">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white font-bold">Source Environment</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Database className="w-12 h-12 text-cyan-400" />
              <div>
                <h3 className="text-white font-bold text-lg">Production</h3>
                <p className="text-slate-400 text-sm">glory_wave_prod</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-purple-500/30">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white font-bold">Target Environment</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Database className="w-12 h-12 text-purple-400" />
              <div>
                <h3 className="text-white font-bold text-lg">Staging</h3>
                <p className="text-slate-400 text-sm">glory_wave_staging</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Results */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-bold">Differences Found</CardTitle>
            <Badge className="bg-orange-500">{differences.length} differences</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {differences.map((diff, idx) => (
              <Card key={idx} className="bg-slate-900/50 border-yellow-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <AlertTriangle className="w-6 h-6 text-yellow-400" />
                      <div>
                        <h4 className="text-white font-bold">{diff.table}.{diff.field}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-cyan-400 bg-slate-800 px-2 py-1 rounded text-xs">{diff.env1}</code>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <code className="text-purple-400 bg-slate-800 px-2 py-1 rounded text-xs">{diff.env2}</code>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                      Sync
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