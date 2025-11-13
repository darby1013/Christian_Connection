import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Copy, Database, Play, CheckCircle, Clock, Activity, Zap
} from "lucide-react";

export default function AdminDatabaseCloning() {
  const [cloning, setCloning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cloneName, setCloneName] = useState('');

  const clones = [
    { name: 'Development Clone', size: 125.4, created: '2024-12-20', status: 'active', lastSync: '2 hours ago' },
    { name: 'Testing Clone', size: 125.4, created: '2024-12-18', status: 'active', lastSync: '1 day ago' },
  ];

  const startClone = async () => {
    if (!cloneName) {
      alert('Please enter a name for the clone');
      return;
    }

    setCloning(true);
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    setCloning(false);
    alert('✅ Database cloned successfully!');
    setCloneName('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Database Cloning</h2>
        <p className="text-slate-400 font-semibold">Create database clones for development and testing</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Copy className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{clones.length}</p>
            <p className="text-slate-400 text-sm">Active Clones</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Database className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">
              {clones.reduce((sum, c) => sum + c.size, 0).toFixed(1)}MB
            </p>
            <p className="text-slate-400 text-sm">Total Clone Size</p>
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
            <Zap className="w-10 h-10 text-yellow-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">~3min</p>
            <p className="text-slate-400 text-sm">Avg Clone Time</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Clone */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Create New Clone</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Input
            placeholder="Clone name (e.g., staging-2024-12)"
            value={cloneName}
            onChange={(e) => setCloneName(e.target.value)}
            className="bg-slate-900 border-slate-700 text-white"
          />

          {cloning && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-300 font-bold">Cloning database...</span>
                <span className="text-cyan-200">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          )}

          <Button
            onClick={startClone}
            disabled={cloning}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 h-12"
          >
            {cloning ? (
              <><Activity className="w-5 h-5 mr-2 animate-pulse" />Cloning...</>
            ) : (
              <><Copy className="w-5 h-5 mr-2" />Create Clone</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Clones */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Active Database Clones</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {clones.map((clone, idx) => (
              <Card key={idx} className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Database className="w-8 h-8 text-cyan-400" />
                      <div>
                        <h4 className="text-white font-bold">{clone.name}</h4>
                        <p className="text-slate-400 text-sm">
                          {clone.size}MB • Created: {clone.created} • Last sync: {clone.lastSync}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-500">{clone.status}</Badge>
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