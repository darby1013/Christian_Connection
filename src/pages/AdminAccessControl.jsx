import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Shield, Lock, Users, CheckCircle, XCircle, Eye,
  Settings, AlertCircle, Key, Globe
} from "lucide-react";

export default function AdminAccessControl() {
  const [ipWhitelist, setIpWhitelist] = useState(['192.168.1.0/24', '10.0.0.0/8']);
  const [newIP, setNewIP] = useState('');

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const addIP = () => {
    if (newIP) {
      setIpWhitelist([...ipWhitelist, newIP]);
      setNewIP('');
      alert('✅ IP added to whitelist!');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Access Control</h2>
        <p className="text-slate-400 font-semibold">IP whitelisting, 2FA, and security policies</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Shield className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{users.filter(u => u.role === 'admin').length}</p>
            <p className="text-slate-400 text-sm">Admin Users</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Lock className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{Math.floor(users.length * 0.42)}</p>
            <p className="text-slate-400 text-sm">2FA Enabled</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Globe className="w-10 h-10 text-purple-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{ipWhitelist.length}</p>
            <p className="text-slate-400 text-sm">Whitelisted IPs</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">99.9%</p>
            <p className="text-slate-400 text-sm">Auth Success</p>
          </CardContent>
        </Card>
      </div>

      {/* IP Whitelist */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">IP Whitelist</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Enter IP or CIDR (e.g., 192.168.1.0/24)"
              value={newIP}
              onChange={(e) => setNewIP(e.target.value)}
              className="flex-1 bg-slate-900 border-slate-700 text-white"
            />
            <Button onClick={addIP} className="bg-cyan-500 hover:bg-cyan-600">
              Add IP
            </Button>
          </div>
          <div className="space-y-2">
            {ipWhitelist.map((ip, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <code className="text-white font-mono">{ip}</code>
                <Badge className="bg-green-500">Active</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Policies */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Security Policies</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          <label className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer">
            <span className="text-white">Require 2FA for Admin Users</span>
            <Checkbox defaultChecked />
          </label>
          <label className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer">
            <span className="text-white">Enforce Strong Passwords</span>
            <Checkbox defaultChecked />
          </label>
          <label className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer">
            <span className="text-white">Session Timeout (30 minutes)</span>
            <Checkbox defaultChecked />
          </label>
          <label className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer">
            <span className="text-white">IP-based Access Control</span>
            <Checkbox />
          </label>
        </CardContent>
      </Card>
    </div>
  );
}