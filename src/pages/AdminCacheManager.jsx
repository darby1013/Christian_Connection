import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Zap, Trash2, RefreshCw, Activity, TrendingUp, Database,
  Clock, CheckCircle, HardDrive, Package, Shield, AlertCircle
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

  const [autoClearSettings, setAutoClearSettings] = useState({
    afterUpdates: true,
    afterPatches: true,
    afterAddons: true,
    scheduledDaily: false
  });

  const clearCache = async (type) => {
    setClearing(true);
    
    // Simulate cache clearing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In production, this would call actual cache clearing APIs
    // For now, we'll reload the page to clear browser cache
    if (type === 'All') {
      if (confirm('This will reload the application to clear all caches. Continue?')) {
        window.location.reload();
      }
    }
    
    setClearing(false);
    alert(`✅ ${type} cache cleared!`);
  };

  const clearSpecificCache = async (cacheName) => {
    setClearing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setClearing(false);
    alert(`✅ ${cacheName} cache cleared successfully!`);
  };

  const warmCache = async () => {
    setClearing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setClearing(false);
    alert('✅ Cache warmed up! Frequently accessed data is now cached.');
  };

  const cacheTypes = [
    { name: 'Query Cache', size: 145.3, entries: 8421, color: 'cyan', description: 'Database query results' },
    { name: 'Asset Cache', size: 67.8, entries: 2341, color: 'purple', description: 'Images, videos, static files' },
    { name: 'API Cache', size: 32.6, entries: 2085, color: 'green', description: 'API response cache' },
    { name: 'Page Cache', size: 12.5, entries: 547, color: 'blue', description: 'Rendered pages' },
    { name: 'Session Cache', size: 8.9, entries: 421, color: 'yellow', description: 'User sessions' },
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

      {/* Auto-Clear Settings */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Automatic Cache Clearing
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          <label className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-800/50">
            <div>
              <p className="text-white font-semibold">Clear after system updates</p>
              <p className="text-slate-400 text-xs">Automatically clear cache when app is updated</p>
            </div>
            <Checkbox
              checked={autoClearSettings.afterUpdates}
              onCheckedChange={(checked) => setAutoClearSettings({...autoClearSettings, afterUpdates: checked})}
            />
          </label>
          <label className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-800/50">
            <div>
              <p className="text-white font-semibold">Clear after patches</p>
              <p className="text-slate-400 text-xs">Clear cache when security patches are applied</p>
            </div>
            <Checkbox
              checked={autoClearSettings.afterPatches}
              onCheckedChange={(checked) => setAutoClearSettings({...autoClearSettings, afterPatches: checked})}
            />
          </label>
          <label className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-800/50">
            <div>
              <p className="text-white font-semibold">Clear after installing add-ons</p>
              <p className="text-slate-400 text-xs">Clear cache when new plugins or features are added</p>
            </div>
            <Checkbox
              checked={autoClearSettings.afterAddons}
              onCheckedChange={(checked) => setAutoClearSettings({...autoClearSettings, afterAddons: checked})}
            />
          </label>
          <label className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-800/50">
            <div>
              <p className="text-white font-semibold">Scheduled daily clear (3 AM)</p>
              <p className="text-slate-400 text-xs">Automatically clear cache daily at 3 AM</p>
            </div>
            <Checkbox
              checked={autoClearSettings.scheduledDaily}
              onCheckedChange={(checked) => setAutoClearSettings({...autoClearSettings, scheduledDaily: checked})}
            />
          </label>

          <Button className="w-full bg-cyan-500 hover:bg-cyan-600 mt-4">
            <Settings className="w-4 h-4 mr-2" />
            Save Auto-Clear Settings
          </Button>
        </CardContent>
      </Card>

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
                    <p className="text-slate-400 text-xs">{cache.description}</p>
                    <p className="text-slate-500 text-xs">{cache.entries.toLocaleString()} entries • {cache.size}MB</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => clearSpecificCache(cache.name)}
                    disabled={clearing}
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-900/20"
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
      <div className="grid md:grid-cols-3 gap-4">
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

        <Button
          onClick={warmCache}
          disabled={clearing}
          className="bg-cyan-500 hover:bg-cyan-600 h-16 text-lg"
        >
          <Zap className="w-5 h-5 mr-2" />
          Warm Up Cache
        </Button>

        <Button
          onClick={() => window.location.reload()}
          className="bg-purple-500 hover:bg-purple-600 h-16 text-lg"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Force Reload App
        </Button>
      </div>

      {/* Cache Health Alert */}
      <Card className="bg-green-900/20 border-green-500/30">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-400" />
          <div className="flex-1">
            <p className="text-green-300 font-bold">Cache Performance: Excellent</p>
            <p className="text-green-200 text-sm">
              {autoClearSettings.afterUpdates && autoClearSettings.afterPatches && autoClearSettings.afterAddons
                ? '✅ Auto-clear enabled for updates, patches, and add-ons'
                : '⚠️ Enable all auto-clear options for best performance'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}