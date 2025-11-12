import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Server, CheckCircle, AlertTriangle, RefreshCw,
  Database, Globe, Zap, Activity, Copy
} from "lucide-react";
import { format } from "date-fns";

export default function AdminReplicationManager() {
  const [syncing, setSyncing] = useState(false);

  const replicaServers = [
    {
      id: 'replica_1',
      name: 'US East Replica',
      location: 'Virginia, USA',
      status: 'synced',
      lag: 0.2,
      last_sync: new Date(Date.now() - 30 * 1000),
      health: 'healthy',
      queries_served: 15200
    },
    {
      id: 'replica_2',
      name: 'EU West Replica',
      location: 'Ireland, EU',
      status: 'syncing',
      lag: 1.5,
      last_sync: new Date(Date.now() - 2 * 60 * 1000),
      health: 'healthy',
      queries_served: 8900
    },
    {
      id: 'replica_3',
      name: 'Asia Pacific Replica',
      location: 'Singapore',
      status: 'warning',
      lag: 5.2,
      last_sync: new Date(Date.now() - 6 * 60 * 1000),
      health: 'degraded',
      queries_served: 4500
    }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'synced': return 'bg-green-500';
      case 'syncing': return 'bg-cyan-500';
      case 'warning': return 'bg-amber-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'synced': return <CheckCircle className="w-5 h-5" />;
      case 'syncing': return <RefreshCw className="w-5 h-5 animate-spin" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      default: return <Server className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Replication Manager</h2>
          <p className="text-slate-400 font-semibold">Multi-region database replication & failover</p>
        </div>
        <Button onClick={() => setSyncing(true)} className="bg-cyan-500 hover:bg-cyan-600">
          <RefreshCw className="w-4 h-4 mr-2" />
          Force Sync All
        </Button>
      </div>

      {/* Replication Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Globe className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">{replicaServers.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{replicaServers.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Replica Servers</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">Synced</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{replicaServers.filter(r => r.status === 'synced').length}</p>
            <p className="text-slate-400 text-sm font-semibold">Healthy Replicas</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">Low</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">0.2s</p>
            <p className="text-slate-400 text-sm font-semibold">Avg Replication Lag</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-green-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">28.6K</p>
            <p className="text-slate-400 text-sm font-semibold">Queries Distributed</p>
          </CardContent>
        </Card>
      </div>

      {/* Replica Servers */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Replica Servers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-700">
            {replicaServers.map((replica) => (
              <div key={replica.id} className="p-6 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-white font-bold text-lg">{replica.name}</h3>
                      <Badge className={getStatusColor(replica.status)}>
                        {getStatusIcon(replica.status)}
                        <span className="ml-1">{replica.status.toUpperCase()}</span>
                      </Badge>
                      <Badge className={`${replica.health === 'healthy' ? 'bg-green-500' : 'bg-amber-500'}`}>
                        {replica.health}
                      </Badge>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 mb-3">
                      <div className="p-3 bg-slate-900/50 rounded border border-slate-700">
                        <p className="text-slate-400 text-xs mb-1">Location</p>
                        <p className="text-white font-semibold text-sm flex items-center gap-1">
                          <Globe className="w-4 h-4 text-cyan-400" />
                          {replica.location}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-900/50 rounded border border-slate-700">
                        <p className="text-slate-400 text-xs mb-1">Replication Lag</p>
                        <p className="text-white font-semibold text-sm flex items-center gap-1">
                          <Zap className={`w-4 h-4 ${replica.lag < 2 ? 'text-green-400' : 'text-amber-400'}`} />
                          {replica.lag}s
                        </p>
                      </div>
                      <div className="p-3 bg-slate-900/50 rounded border border-slate-700">
                        <p className="text-slate-400 text-xs mb-1">Queries Served</p>
                        <p className="text-white font-semibold text-sm">{replica.queries_served.toLocaleString()}/day</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      Last sync: {format(replica.last_sync, 'HH:mm:ss')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Sync
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}