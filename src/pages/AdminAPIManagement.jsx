import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Key, Copy, Eye, EyeOff, Plus, Trash2, RefreshCw, Shield,
  Activity, Clock, TrendingUp, AlertCircle, CheckCircle, Zap
} from "lucide-react";

export default function AdminAPIManagement() {
  const [apiKeys, setApiKeys] = useState([
    { id: '1', name: 'Production API Key', key: 'sk_live_' + 'x'.repeat(32), created: '2024-01-15', lastUsed: '2024-12-25', requests: 15847, status: 'active' },
    { id: '2', name: 'Development API Key', key: 'sk_test_' + 'y'.repeat(32), created: '2024-02-10', lastUsed: '2024-12-24', requests: 3421, status: 'active' },
  ]);

  const [showKey, setShowKey] = useState({});
  const [newKeyName, setNewKeyName] = useState('');

  const copyToClipboard = (key) => {
    navigator.clipboard.writeText(key);
    alert('✅ API key copied to clipboard!');
  };

  const generateNewKey = () => {
    if (!newKeyName) {
      alert('Please enter a name for the API key');
      return;
    }

    const newKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: 'sk_live_' + Math.random().toString(36).substring(2, 34).padEnd(32, 'x'),
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      requests: 0,
      status: 'active'
    };

    setApiKeys([...apiKeys, newKey]);
    setNewKeyName('');
    alert('✅ New API key generated!');
  };

  const revokeKey = (id) => {
    if (confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      setApiKeys(apiKeys.filter(k => k.id !== id));
      alert('✅ API key revoked!');
    }
  };

  const totalRequests = apiKeys.reduce((sum, k) => sum + k.requests, 0);
  const activeKeys = apiKeys.filter(k => k.status === 'active').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">API Management</h2>
        <p className="text-slate-400 font-semibold">Manage API keys, monitor usage, and configure access controls</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Key className="w-10 h-10 text-cyan-400" />
              <Badge className="bg-cyan-500">Active</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">{activeKeys}</p>
            <p className="text-slate-400 text-sm font-semibold">Active API Keys</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Activity className="w-10 h-10 text-green-400" />
              <Badge className="bg-green-500">Live</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">{totalRequests.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Requests</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Zap className="w-10 h-10 text-yellow-400" />
              <Badge className="bg-yellow-500">Fast</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">45ms</p>
            <p className="text-slate-400 text-sm font-semibold">Avg Response</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Shield className="w-10 h-10 text-purple-400" />
              <Badge className="bg-purple-500">Secure</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">256-bit</p>
            <p className="text-slate-400 text-sm font-semibold">Encryption</p>
          </CardContent>
        </Card>
      </div>

      {/* Create New Key */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Generate New API Key</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter API key name (e.g., Mobile App, Third-party Integration)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <Button onClick={generateNewKey} className="bg-cyan-500 hover:bg-cyan-600">
              <Plus className="w-4 h-4 mr-2" />
              Generate Key
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Keys List */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Active API Keys</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {apiKeys.map(key => (
              <Card key={key.id} className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-white font-bold">{key.name}</h4>
                        <Badge className="bg-green-500">Active</Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-slate-300 font-mono text-sm bg-slate-800 px-3 py-1 rounded">
                          {showKey[key.id] ? key.key : key.key.substring(0, 20) + '••••••••••••'}
                        </code>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setShowKey({...showKey, [key.id]: !showKey[key.id]})}
                        >
                          {showKey[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(key.key)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>Created: {key.created}</span>
                        <span>Last used: {key.lastUsed}</span>
                        <span className="text-cyan-400">{key.requests.toLocaleString()} requests</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => revokeKey(key.id)}
                      className="border-red-500/30 text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Revoke
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">API Quick Start</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label className="text-white font-bold mb-2 block">Authentication</Label>
              <pre className="bg-slate-900 p-4 rounded-lg text-green-400 text-sm overflow-x-auto">
{`curl https://api.glorywave.com/v1/users \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
              </pre>
            </div>

            <div>
              <Label className="text-white font-bold mb-2 block">Example Request</Label>
              <pre className="bg-slate-900 p-4 rounded-lg text-green-400 text-sm overflow-x-auto">
{`fetch('https://api.glorywave.com/v1/products', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
}).then(res => res.json())`}
              </pre>
            </div>

            <div className="flex gap-2">
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                View Full Documentation
              </Button>
              <Button variant="outline" className="border-slate-700">
                API Reference
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}