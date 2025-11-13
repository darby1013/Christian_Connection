import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Database, Copy, Activity, CheckCircle, Globe, Server,
  TrendingUp, Clock, Zap, Shield, RefreshCw
} from "lucide-react";

export default function AdminDatabaseReplication() {
  const replicas = [
    { name: 'US-East-1', region: 'Virginia', lag: '0.2s', status: 'healthy', load: 45 },
    { name: 'US-West-1', region: 'California', lag: '0.3s', status: 'healthy', load: 38 },
    { name: 'EU-West-1', region: 'Ireland', lag: '0.5s', status: 'healthy', load: 52 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Database Replication</h2>
        <p className="text-slate-400 font-semibold">Monitor read replicas and manage failover configuration</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Database className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">1</p>
            <p className="text-slate-400 text-sm">Primary Instance</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Copy className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{replicas.length}</p>
            <p className="text-slate-400 text-sm">Read Replicas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">100%</p>
            <p className="text-slate-400 text-sm">Sync Status</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Globe className="w-10 h-10 text-purple-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">3</p>
            <p className="text-slate-400 text-sm">Regions</p>
          </CardContent>
        </Card>
      </div>

      {/* Primary Instance */}
      <Card className="bg-[#1a1f3a] border-cyan-500/30">
        <CardHeader className="border-b border-slate-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-bold flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              Primary Instance
            </CardTitle>
            <Badge className="bg-cyan-500">Master</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">Region</p>
              <p className="text-white font-bold">US-East-1 (Virginia)</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Status</p>
              <Badge className="bg-green-500">Healthy</Badge>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Connections</p>
              <p className="text-white font-bold">147 / 500</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Read Replicas */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Read Replicas</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {replicas.map((replica, idx) => (
              <Card key={idx} className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Server className="w-8 h-8 text-green-400" />
                      <div>
                        <h4 className="text-white font-bold">{replica.name}</h4>
                        <p className="text-slate-400 text-sm">{replica.region}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {replica.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400 mb-1">Replication Lag</p>
                      <p className="text-cyan-400 font-bold">{replica.lag}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-1">Load</p>
                      <div>
                        <p className="text-white font-bold mb-1">{replica.load}%</p>
                        <Progress value={replica.load} className="h-1" />
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-1">Actions</p>
                      <Button size="sm" variant="outline" className="border-slate-700">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Sync
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