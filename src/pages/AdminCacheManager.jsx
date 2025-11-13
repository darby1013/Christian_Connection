import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Zap, Trash2, RefreshCw, Activity, TrendingUp, Database,
  Clock, CheckCircle, HardDrive, Package
} from "lucide-react";

export default function AdminCacheManager() {
  const [clearing, setClearing] = useState(false);
  const [cacheStats] = useState({
    size: 245.7,
    entries: 12847,
    hitRate: 94.2,
    missRate: 5.8,
    evictions: 342
  });

  const clearCache = async (type) => {
    setClearing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setClearing(false);
    alert(`✅ ${type} cache cleared!`);
  };

  const cacheTypes = [
    { name: 'Query Cache', size: 145.3, entries: 8421, color: 'cyan' },
    { name: 'Asset Cache', size: 67.8, entries: 2341, color: 'purple' },
    { name: 'API Cache', size: 32.6, entries: 2085, color: 'green' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Cache Management</h2>
        <p className="text-slate-400 font-semibold">Monitor and manage application cache for optimal performance</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <HardDrive className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{cacheStats.size}MB</p>
            <p className="text-slate-400 text-sm">Cache Size</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Package className="w-10 h-10 text-purple-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{cacheStats.entries.toLocaleString()}</p>
            <p className="text-slate-400 text-sm">Total Entries</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{cacheStats.hitRate}%</p>
            <p className="text-slate-400 text-sm">Hit Rate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Activity className="w-10 h-10 text-yellow-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{cacheStats.missRate}%</p>
            <p className="text-slate-400 text-sm">Miss Rate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <TrendingUp className="w-10 h-10 text-blue-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{cacheStats.evictions}</p>
            <p className="text-slate-400 text-sm">Evictions</p>
          </CardContent>
        </Card>
      </div>

      {/* Cache Types */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Cache Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {cacheTypes.map(cache => (
              <div key={cache.name}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-white font-bold">{cache.name}</h4>
                    <p className="text-slate-400 text-sm">{cache.entries.toLocaleString()} entries • {cache.size}MB</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => clearCache(cache.name)}
                    disabled={clearing}
                    variant="outline"
                    className="border-red-500/30 text-red-400"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
                <Progress value={(cache.size / cacheStats.size) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Button
          onClick={() => clearCache('All')}
          disabled={clearing}
          className="bg-red-500 hover:bg-red-600 h-16 text-lg"
        >
          {clearing ? (
            <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Clearing...</>
          ) : (
            <><Trash2 className="w-5 h-5 mr-2" />Clear All Cache</>
          )}
        </Button>

        <Button className="bg-cyan-500 hover:bg-cyan-600 h-16 text-lg">
          <Zap className="w-5 h-5 mr-2" />
          Warm Up Cache
        </Button>
      </div>
    </div>
  );
}