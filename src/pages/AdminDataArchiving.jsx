import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Archive, Clock, Database, Download, CheckCircle, HardDrive,
  TrendingDown, Activity, Calendar
} from "lucide-react";

export default function AdminDataArchiving() {
  const archives = [
    {
      name: 'Q3 2024 Orders',
      size: 245.7,
      records: 12847,
      archived: '2024-10-01',
      status: 'completed',
      retention: '7 years'
    },
    {
      name: 'Old User Sessions',
      size: 87.3,
      records: 34251,
      archived: '2024-11-15',
      status: 'completed',
      retention: '1 year'
    },
  ];

  const archivingRules = [
    { entity: 'Order', condition: 'Older than 2 years', frequency: 'Quarterly', autoArchive: true },
    { entity: 'AuditLog', condition: 'Older than 5 years', frequency: 'Yearly', autoArchive: true },
    { entity: 'Session', condition: 'Older than 30 days', frequency: 'Daily', autoArchive: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Data Archiving</h2>
          <p className="text-slate-400 font-semibold">Automate data archival for compliance and performance</p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600">
          <Archive className="w-4 h-4 mr-2" />
          Create Archive
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Archive className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{archives.length}</p>
            <p className="text-slate-400 text-sm">Total Archives</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <HardDrive className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">
              {archives.reduce((sum, a) => sum + a.size, 0).toFixed(1)}MB
            </p>
            <p className="text-slate-400 text-sm">Archived Size</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Database className="w-10 h-10 text-purple-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">
              {archives.reduce((sum, a) => sum + a.records, 0).toLocaleString()}
            </p>
            <p className="text-slate-400 text-sm">Archived Records</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <TrendingDown className="w-10 h-10 text-blue-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">-15%</p>
            <p className="text-slate-400 text-sm">DB Size Reduction</p>
          </CardContent>
        </Card>
      </div>

      {/* Archives */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Archive Storage</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {archives.map((archive, idx) => (
              <Card key={idx} className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Archive className="w-8 h-8 text-cyan-400" />
                      <div>
                        <h4 className="text-white font-bold">{archive.name}</h4>
                        <p className="text-slate-400 text-sm">
                          {archive.records.toLocaleString()} records • {archive.size}MB • Archived: {archive.archived}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500">{archive.status}</Badge>
                      <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                        <Download className="w-3 h-3 mr-1" />
                        Restore
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Archiving Rules */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Archiving Rules</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {archivingRules.map((rule, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div>
                  <h4 className="text-white font-bold">{rule.entity}</h4>
                  <p className="text-slate-400 text-sm">{rule.condition} • {rule.frequency}</p>
                </div>
                <Badge className={rule.autoArchive ? 'bg-cyan-500' : 'bg-slate-500'}>
                  {rule.autoArchive ? 'Auto-Archive' : 'Manual'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}