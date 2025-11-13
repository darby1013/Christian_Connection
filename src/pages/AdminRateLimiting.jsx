import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Shield, Activity, Clock, Users, AlertCircle, CheckCircle,
  TrendingUp, Settings, Zap, Lock
} from "lucide-react";

export default function AdminRateLimiting() {
  const [limits, setLimits] = useState({
    api_requests: 1000,
    login_attempts: 5,
    export_operations: 10,
    upload_size: 100
  });

  const [blockedIPs] = useState([
    { ip: '192.168.1.100', reason: 'Too many login attempts', blocked: '2024-12-25', requests: 342 },
    { ip: '10.0.0.50', reason: 'Suspicious activity', blocked: '2024-12-24', requests: 1205 },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Rate Limiting & Security</h2>
        <p className="text-slate-400 font-semibold">Configure rate limits and monitor blocked IPs</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Shield className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">99.2%</p>
            <p className="text-slate-400 text-sm">Requests Allowed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">127</p>
            <p className="text-slate-400 text-sm">Blocked Requests</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Lock className="w-10 h-10 text-orange-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{blockedIPs.length}</p>
            <p className="text-slate-400 text-sm">Blocked IPs</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Activity className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">15.2K</p>
            <p className="text-slate-400 text-sm">Requests Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Rate Limit Configuration */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Rate Limit Configuration</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <Label className="text-white font-bold mb-2 block">
              API Requests per Hour: {limits.api_requests}
            </Label>
            <Slider
              value={[limits.api_requests]}
              max={5000}
              step={100}
              onValueChange={([value]) => setLimits({...limits, api_requests: value})}
            />
          </div>

          <div>
            <Label className="text-white font-bold mb-2 block">
              Login Attempts per Hour: {limits.login_attempts}
            </Label>
            <Slider
              value={[limits.login_attempts]}
              max={20}
              step={1}
              onValueChange={([value]) => setLimits({...limits, login_attempts: value})}
            />
          </div>

          <div>
            <Label className="text-white font-bold mb-2 block">
              Export Operations per Day: {limits.export_operations}
            </Label>
            <Slider
              value={[limits.export_operations]}
              max={50}
              step={5}
              onValueChange={([value]) => setLimits({...limits, export_operations: value})}
            />
          </div>

          <Button className="w-full bg-cyan-500 hover:bg-cyan-600">
            <Settings className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </CardContent>
      </Card>

      {/* Blocked IPs */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Blocked IP Addresses</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {blockedIPs.map((item, idx) => (
              <Card key={idx} className="bg-red-900/20 border-red-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-mono font-bold">{item.ip}</p>
                      <p className="text-red-300 text-sm">{item.reason}</p>
                      <p className="text-red-200 text-xs mt-1">
                        Blocked: {item.blocked} • {item.requests} blocked requests
                      </p>
                    </div>
                    <Button size="sm" className="bg-green-500 hover:bg-green-600">
                      Unblock
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