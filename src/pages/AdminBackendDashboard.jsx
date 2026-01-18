import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import EnterpriseChart from '../components/admin/EnterpriseChart';
import { Server, Zap, Clock, Code, AlertCircle, CheckCircle } from 'lucide-react';

export default function AdminBackendDashboard() {
  const queryClient = useQueryClient();

  const { data: webhookLogs = [] } = useQuery({
    queryKey: ['webhookLogs'],
    queryFn: () => base44.entities.WebhookLog.list('-created_date', 50),
    initialData: []
  });

  const { data: automationRules = [] } = useQuery({
    queryKey: ['automationRules'],
    queryFn: () => base44.entities.AutomationRule.list(),
    initialData: []
  });

  const { data: scheduledTasks = [] } = useQuery({
    queryKey: ['scheduledTasks'],
    queryFn: () => base44.entities.ScheduledTask.list(),
    initialData: []
  });

  const { data: backgroundJobs = [] } = useQuery({
    queryKey: ['backgroundJobs'],
    queryFn: () => base44.entities.BackgroundJob.list('-created_date', 20),
    initialData: []
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => base44.entities.IntegrationConfig.list(),
    initialData: []
  });

  const webhookColumns = [
    { header: 'Type', key: 'webhook_type', render: (val) => <Badge className="bg-blue-500">{val}</Badge> },
    { header: 'Status', key: 'response_status', render: (val) => <Badge className={val === 200 ? 'bg-green-500' : 'bg-red-500'}>{val}</Badge> },
    { header: 'Success', key: 'success', render: (val) => val ? <CheckCircle className="w-4 h-4 text-green-400" /> : <AlertCircle className="w-4 h-4 text-red-400" /> },
    { header: 'Retries', key: 'retry_count' },
    { header: 'Date', key: 'created_date', render: (val) => new Date(val).toLocaleString() }
  ];

  const automationColumns = [
    { header: 'Name', key: 'name', render: (val) => <span className="text-white font-bold">{val}</span> },
    { header: 'Trigger', key: 'trigger_event', render: (val) => <Badge className="bg-purple-500">{val}</Badge> },
    { header: 'Executions', key: 'execution_count' },
    { header: 'Status', key: 'is_active', render: (val) => <Badge className={val ? 'bg-green-500' : 'bg-gray-500'}>{val ? 'Active' : 'Inactive'}</Badge> },
    { header: 'Last Run', key: 'last_executed_at', render: (val) => val ? new Date(val).toLocaleString() : 'Never' }
  ];

  const taskColumns = [
    { header: 'Name', key: 'name', render: (val) => <span className="text-white font-bold">{val}</span> },
    { header: 'Type', key: 'task_type', render: (val) => <Badge className="bg-cyan-500">{val}</Badge> },
    { header: 'Schedule', key: 'schedule', render: (val) => <span className="text-slate-400 font-mono text-xs">{val}</span> },
    { header: 'Runs', key: 'run_count' },
    { header: 'Success Rate', key: 'success_count', render: (val, row) => {
      const rate = row.run_count > 0 ? ((val / row.run_count) * 100).toFixed(1) : 0;
      return <Badge className={rate > 90 ? 'bg-green-500' : 'bg-amber-500'}>{rate}%</Badge>;
    }}
  ];

  const jobColumns = [
    { header: 'Type', key: 'job_type', render: (val) => <Badge className="bg-indigo-500">{val}</Badge> },
    { header: 'Status', key: 'status', render: (val) => {
      const colors = { pending: 'bg-gray-500', running: 'bg-blue-500', completed: 'bg-green-500', failed: 'bg-red-500' };
      return <Badge className={colors[val]}>{val}</Badge>;
    }},
    { header: 'Progress', key: 'progress', render: (val) => <span className="text-cyan-400">{val}%</span> },
    { header: 'Started', key: 'started_at', render: (val) => val ? new Date(val).toLocaleString() : '-' }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Backend Systems"
        subtitle="Automation, webhooks, scheduled tasks & integrations"
        icon={Server}
        badge="BACKEND"
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-white">{webhookLogs.filter(w => w.success).length}</p>
                <p className="text-blue-300 text-sm font-bold">Successful Webhooks</p>
              </div>
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-white">{automationRules.filter(r => r.is_active).length}</p>
                <p className="text-purple-300 text-sm font-bold">Active Automations</p>
              </div>
              <Code className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-white">{scheduledTasks.filter(t => t.is_active).length}</p>
                <p className="text-green-300 text-sm font-bold">Scheduled Tasks</p>
              </div>
              <Clock className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-white">{integrations.filter(i => i.is_active).length}</p>
                <p className="text-amber-300 text-sm font-bold">Active Integrations</p>
              </div>
              <Server className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="tasks">Scheduled Tasks</TabsTrigger>
          <TabsTrigger value="jobs">Background Jobs</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-6">
          <EnterpriseChart
            title="Webhook Success Rate"
            type="line"
            data={[
              { date: '01/15', success: 95 },
              { date: '01/16', success: 98 },
              { date: '01/17', success: 92 },
              { date: '01/18', success: 97 }
            ]}
            dataKey="success"
            xKey="date"
            icon={Zap}
          />
          <EnterpriseTable columns={webhookColumns} data={webhookLogs} />
        </TabsContent>

        <TabsContent value="automations" className="space-y-6">
          <Card className="bg-purple-900/20 border-purple-500/30">
            <CardContent className="p-6">
              <h3 className="text-white font-bold text-lg mb-4">Available Automation Triggers</h3>
              <div className="grid md:grid-cols-3 gap-3">
                <Badge className="bg-purple-600 p-3 justify-center">Order Placed</Badge>
                <Badge className="bg-purple-600 p-3 justify-center">Cart Abandoned</Badge>
                <Badge className="bg-purple-600 p-3 justify-center">Product Low Stock</Badge>
                <Badge className="bg-purple-600 p-3 justify-center">User Inactive</Badge>
                <Badge className="bg-purple-600 p-3 justify-center">Review Submitted</Badge>
                <Badge className="bg-purple-600 p-3 justify-center">Payment Success</Badge>
              </div>
            </CardContent>
          </Card>
          <EnterpriseTable columns={automationColumns} data={automationRules} />
        </TabsContent>

        <TabsContent value="tasks">
          <EnterpriseTable columns={taskColumns} data={scheduledTasks} />
        </TabsContent>

        <TabsContent value="jobs">
          <EnterpriseTable columns={jobColumns} data={backgroundJobs} />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {['stripe', 'mailchimp', 'shopify', 'google_analytics', 'facebook_pixel', 'klaviyo'].map(name => {
              const integration = integrations.find(i => i.integration_name === name);
              const isActive = integration?.is_active || false;
              
              return (
                <Card key={name} className="bg-slate-900 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold text-lg capitalize">{name.replace('_', ' ')}</h3>
                      <Badge className={isActive ? 'bg-green-500' : 'bg-gray-500'}>
                        {isActive ? 'Connected' : 'Not Connected'}
                      </Badge>
                    </div>
                    {integration && (
                      <p className="text-slate-400 text-sm">
                        Last synced: {integration.last_synced_at ? new Date(integration.last_synced_at).toLocaleString() : 'Never'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500/30">
        <CardContent className="p-8 text-center">
          <Server className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-white font-black text-2xl mb-2">Enable Backend Functions</h3>
          <p className="text-slate-300 mb-4">
            Unlock custom server-side logic, advanced integrations, and more powerful automations.
          </p>
          <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
            Contact Support to Enable
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}