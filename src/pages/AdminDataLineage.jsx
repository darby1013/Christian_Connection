import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GitBranch, Database, ArrowRight, Users, FileText, Activity
} from "lucide-react";

export default function AdminDataLineage() {
  const dataFlows = [
    {
      source: 'User Registration',
      tables: ['User', 'Notification', 'AuditLog'],
      triggers: ['Welcome Email', 'Analytics Event'],
      impact: 'High'
    },
    {
      source: 'Order Creation',
      tables: ['Order', 'OrderItem', 'Inventory', 'Notification', 'AuditLog'],
      triggers: ['Stock Update', 'Confirmation Email', 'Analytics'],
      impact: 'Critical'
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Data Lineage</h2>
        <p className="text-slate-400 font-semibold">Track data flow and dependencies across your system</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <GitBranch className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{dataFlows.length}</p>
            <p className="text-slate-400 text-sm">Data Flows</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Database className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">14</p>
            <p className="text-slate-400 text-sm">Tracked Tables</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Activity className="w-10 h-10 text-purple-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">27</p>
            <p className="text-slate-400 text-sm">Dependencies</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <ArrowRight className="w-10 h-10 text-blue-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">52</p>
            <p className="text-slate-400 text-sm">Data Transformations</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Flows */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Data Flow Mapping</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {dataFlows.map((flow, idx) => (
              <Card key={idx} className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <h4 className="text-white font-bold text-lg">{flow.source}</h4>
                    <Badge className={flow.impact === 'Critical' ? 'bg-red-500' : 'bg-cyan-500'}>
                      {flow.impact} Impact
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-slate-400 text-sm mb-2 font-semibold">Affected Tables:</p>
                      <div className="flex flex-wrap gap-2">
                        {flow.tables.map(table => (
                          <Badge key={table} className="bg-cyan-500">
                            <Database className="w-3 h-3 mr-1" />
                            {table}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-slate-400 text-sm mb-2 font-semibold">Triggered Actions:</p>
                      <div className="flex flex-wrap gap-2">
                        {flow.triggers.map(trigger => (
                          <Badge key={trigger} className="bg-purple-500">
                            <Activity className="w-3 h-3 mr-1" />
                            {trigger}
                          </Badge>
                        ))}
                      </div>
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