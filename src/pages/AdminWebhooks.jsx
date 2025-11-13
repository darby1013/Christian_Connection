import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Webhook, Plus, Trash2, Play, Pause, Activity, CheckCircle,
  XCircle, Clock, AlertTriangle, Settings, TrendingUp, Zap
} from "lucide-react";

export default function AdminWebhooks() {
  const [webhooks, setWebhooks] = useState([
    {
      id: '1',
      url: 'https://example.com/webhook',
      events: ['order.created', 'order.updated', 'user.created'],
      status: 'active',
      successRate: 98.5,
      lastTriggered: '2024-12-25 14:30',
      totalCalls: 1247
    }
  ]);

  const [showCreate, setShowCreate] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: []
  });

  const availableEvents = [
    { value: 'user.created', label: 'User Created' },
    { value: 'user.updated', label: 'User Updated' },
    { value: 'order.created', label: 'Order Created' },
    { value: 'order.updated', label: 'Order Updated' },
    { value: 'product.created', label: 'Product Created' },
    { value: 'payment.success', label: 'Payment Success' },
    { value: 'payment.failed', label: 'Payment Failed' },
  ];

  const createWebhook = () => {
    if (!newWebhook.url || newWebhook.events.length === 0) {
      alert('Please enter URL and select at least one event');
      return;
    }

    setWebhooks([...webhooks, {
      id: Date.now().toString(),
      ...newWebhook,
      status: 'active',
      successRate: 100,
      lastTriggered: 'Never',
      totalCalls: 0
    }]);

    setNewWebhook({ url: '', events: [] });
    setShowCreate(false);
    alert('✅ Webhook created!');
  };

  const toggleEvent = (event) => {
    if (newWebhook.events.includes(event)) {
      setNewWebhook({...newWebhook, events: newWebhook.events.filter(e => e !== event)});
    } else {
      setNewWebhook({...newWebhook, events: [...newWebhook.events, event]});
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Webhook Management</h2>
          <p className="text-slate-400 font-semibold">Configure webhooks for real-time event notifications</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-cyan-500 hover:bg-cyan-600">
          <Plus className="w-4 h-4 mr-2" />
          Create Webhook
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Webhook className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{webhooks.length}</p>
            <p className="text-slate-400 text-sm">Active Webhooks</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Activity className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">
              {webhooks.reduce((sum, w) => sum + w.totalCalls, 0)}
            </p>
            <p className="text-slate-400 text-sm">Total Deliveries</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">98.5%</p>
            <p className="text-slate-400 text-sm">Success Rate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Zap className="w-10 h-10 text-yellow-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">127ms</p>
            <p className="text-slate-400 text-sm">Avg Latency</p>
          </CardContent>
        </Card>
      </div>

      {/* Webhooks List */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Active Webhooks</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {webhooks.map(webhook => (
              <Card key={webhook.id} className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-white font-bold font-mono text-sm">{webhook.url}</h4>
                        <Badge className={webhook.status === 'active' ? 'bg-green-500' : 'bg-slate-500'}>
                          {webhook.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {webhook.events.map(event => (
                          <Badge key={event} className="bg-cyan-500/20 text-cyan-300 text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>{webhook.totalCalls} deliveries</span>
                        <span className="text-green-400">{webhook.successRate}% success</span>
                        <span>Last: {webhook.lastTriggered}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-slate-700">
                        <Play className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-500/30 text-red-400">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Webhook Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <Card className="bg-[#1a1f3a] border-slate-700 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold">Create New Webhook</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label className="text-white font-bold mb-2 block">Webhook URL</Label>
                <Input
                  placeholder="https://your-domain.com/webhook"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({...newWebhook, url: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-white font-bold mb-2 block">Events to Subscribe</Label>
                <div className="grid md:grid-cols-2 gap-3">
                  {availableEvents.map(event => (
                    <label key={event.value} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-800/50 rounded">
                      <Checkbox
                        checked={newWebhook.events.includes(event.value)}
                        onCheckedChange={() => toggleEvent(event.value)}
                      />
                      <span className="text-slate-300 text-sm">{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => setShowCreate(false)} variant="outline" className="flex-1 border-slate-700">
                  Cancel
                </Button>
                <Button onClick={createWebhook} className="flex-1 bg-cyan-500 hover:bg-cyan-600">
                  Create Webhook
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}